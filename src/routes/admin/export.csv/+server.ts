import { getDb, getBotDb } from '$lib/server/db';
import { loadReport } from '$lib/server/report';
import type { RequestHandler } from './$types';

function cell(value: unknown): string {
	const s = value == null ? '' : String(value);
	return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * CSV of every interested person (WhatsApp survey completions + web form),
 * merged across both databases. Auth is enforced by hooks.server.ts.
 */
export const GET: RequestHandler = async () => {
	const report = await loadReport(getDb(), getBotDb());
	const header = ['nom', 'via', 'vol', 'disponibilitat', 'quan'];
	const rows = report.people.map((p) =>
		[p.name, p.source, p.action ?? '', p.availability ?? '', p.at ?? ''].map(cell).join(',')
	);
	const csv = [header.join(','), ...rows].join('\n') + '\n';
	return new Response(csv, {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': 'attachment; filename="curs-sardanes-interessats.csv"'
		}
	});
};
