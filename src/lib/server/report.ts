/**
 * Campaign report queries for /admin. Reads this app's own DB (clicks,
 * form_responses) and the whatsapp-bot DB (BOT_DB, read-only by convention) for
 * the conversation funnel. D1 can't join across databases, so each side is
 * queried separately and merged here.
 *
 * BOT_DB may be unconfigured (placeholder id) or empty locally — every BOT_DB
 * read is wrapped so the report still renders (botAvailable=false) instead of
 * crashing.
 */

export interface LinkTotal {
	code: string;
	label: string | null;
	archived: boolean;
	clicks: number;
}

export interface DayCount {
	day: string;
	clicks: number;
}

export interface Funnel {
	clicks: number;
	conversations: number;
	completed: number;
	grup: number;
	avisam: number;
	res: number;
	webForms: number;
}

export interface Person {
	name: string;
	source: 'whatsapp' | 'web';
	action: string | null;
	availability: string | null;
	at: string | null;
}

export interface Report {
	botAvailable: boolean;
	totals: LinkTotal[];
	byDay: DayCount[];
	funnel: Funnel;
	people: Person[];
}

const FLOW = 'curs-sardanes';

interface DataJson {
	action?: string;
	availability?: string;
	availability_raw?: string;
}

function parseData(json: string): DataJson {
	try {
		return JSON.parse(json) as DataJson;
	} catch {
		return {};
	}
}

async function ownReport(db: D1Database): Promise<{
	totals: LinkTotal[];
	byDay: DayCount[];
	clicks: number;
	webForms: number;
	webPeople: Person[];
}> {
	// Totals per link: every link row LEFT JOINed with its click count, so links
	// with zero clicks still appear; plus any `unknown:*` / orphan codes.
	const totalsRes = await db
		.prepare(
			`SELECT c.code AS code, l.label AS label, COALESCE(l.archived, 0) AS archived,
			        COUNT(cl.id) AS clicks
			   FROM (SELECT code FROM links
			         UNION SELECT DISTINCT code FROM clicks) c
			   LEFT JOIN links l ON l.code = c.code
			   LEFT JOIN clicks cl ON cl.code = c.code
			  GROUP BY c.code
			  ORDER BY clicks DESC, c.code`
		)
		.all<{ code: string; label: string | null; archived: number; clicks: number }>();

	const byDayRes = await db
		.prepare(
			`SELECT substr(ts, 1, 10) AS day, COUNT(*) AS clicks
			   FROM clicks GROUP BY day ORDER BY day`
		)
		.all<{ day: string; clicks: number }>();

	const clicksRow = await db.prepare('SELECT COUNT(*) AS n FROM clicks').first<{ n: number }>();
	const formsRow = await db
		.prepare('SELECT COUNT(*) AS n FROM form_responses')
		.first<{ n: number }>();

	const webRes = await db
		.prepare(
			`SELECT name, availability, availability_raw, ts
			   FROM form_responses ORDER BY ts DESC`
		)
		.all<{ name: string; availability: string; availability_raw: string | null; ts: string }>();

	return {
		totals: (totalsRes.results ?? []).map((r) => ({
			code: r.code,
			label: r.label,
			archived: r.archived === 1,
			clicks: r.clicks
		})),
		byDay: byDayRes.results ?? [],
		clicks: clicksRow?.n ?? 0,
		webForms: formsRow?.n ?? 0,
		webPeople: (webRes.results ?? []).map((r) => ({
			name: r.name,
			source: 'web' as const,
			action: null,
			availability: r.availability === 'custom' ? (r.availability_raw ?? 'custom') : r.availability,
			at: r.ts
		}))
	};
}

async function botReport(botDb: D1Database): Promise<{
	conversations: number;
	completed: number;
	grup: number;
	avisam: number;
	res: number;
	people: Person[];
}> {
	const convRow = await botDb
		.prepare(`SELECT COUNT(DISTINCT person_id) AS n FROM flow_instances WHERE flow_type = ?`)
		.bind(FLOW)
		.first<{ n: number }>();

	const completedRes = await botDb
		.prepare(
			`SELECT p.display_name AS display_name, p.profile_name AS profile_name,
			        f.data_json AS data_json, f.completed_at AS completed_at
			   FROM flow_instances f
			   JOIN people p ON p.id = f.person_id
			  WHERE f.flow_type = ? AND f.status = 'completed'
			  ORDER BY f.completed_at DESC`
		)
		.bind(FLOW)
		.all<{
			display_name: string | null;
			profile_name: string | null;
			data_json: string;
			completed_at: string | null;
		}>();

	let grup = 0;
	let avisam = 0;
	let res = 0;
	const people: Person[] = (completedRes.results ?? []).map((r) => {
		const data = parseData(r.data_json);
		if (data.action === 'grup') grup++;
		else if (data.action === 'avisam') avisam++;
		else if (data.action === 'res') res++;
		const availability =
			data.availability === 'custom'
				? (data.availability_raw ?? 'custom')
				: (data.availability ?? null);
		return {
			name: r.display_name || r.profile_name || 'Anònim',
			source: 'whatsapp' as const,
			action: data.action ?? null,
			availability,
			at: r.completed_at
		};
	});

	return {
		conversations: convRow?.n ?? 0,
		completed: people.length,
		grup,
		avisam,
		res,
		people
	};
}

export async function loadReport(db: D1Database, botDb: D1Database | undefined): Promise<Report> {
	const own = await ownReport(db);

	let botAvailable = false;
	let bot = { conversations: 0, completed: 0, grup: 0, avisam: 0, res: 0, people: [] as Person[] };
	if (botDb) {
		try {
			bot = await botReport(botDb);
			botAvailable = true;
		} catch {
			// BOT_DB unconfigured / empty / schema missing → render without it.
			botAvailable = false;
		}
	}

	const people = [...bot.people, ...own.webPeople].sort((a, b) =>
		(b.at ?? '').localeCompare(a.at ?? '')
	);

	return {
		botAvailable,
		totals: own.totals,
		byDay: own.byDay,
		funnel: {
			clicks: own.clicks,
			conversations: bot.conversations,
			completed: bot.completed,
			grup: bot.grup,
			avisam: bot.avisam,
			res: bot.res,
			webForms: own.webForms
		},
		people
	};
}
