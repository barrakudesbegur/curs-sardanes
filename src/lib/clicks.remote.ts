import * as v from 'valibot';
import { query, getRequestEvent } from '$app/server';
import { PUBLIC_WA_NUMBER } from '$env/static/public';
import { waMeUrl } from '$lib/wa';
import { platformFromUA, type Platform } from '$lib/ua';
import { normalizeClickCode } from '$lib/code';
import { getDb, knownLinkCodes } from '$lib/server/db';

export type ClickResult = {
	/** The value stored in `clicks.code` — a known code or `unknown:<raw>`. */
	code: string;
	platform: Platform;
	/** The wa.me deep link the page should route the visitor to. */
	waUrl: string;
};

/**
 * Records a click and resolves the WhatsApp target. This is the single logging
 * path shared by `/go` (real short links, `q` = the tracked code) and `/`
 * (direct visits, called with `'direct'`).
 *
 * It is a `query` — not a `command` — because it must run server-side during the
 * page's SSR `load`, so the click is logged even for visitors with JavaScript
 * disabled, and its result (platform + target) drives what the page renders.
 * The write is an intentional side effect: each full-page load runs it exactly
 * once on the server, then the result is serialized for hydration (no re-run,
 * no double count). The `q` argument is deliberately unconstrained — unknown or
 * empty values are valid and get normalized to `unknown:` / `unknown:<raw>`.
 */
export const logClick = query(v.nullable(v.string()), async (q): Promise<ClickResult> => {
	const { request } = getRequestEvent();
	const platform = platformFromUA(request.headers.get('user-agent'));
	const referer = request.headers.get('referer');

	const db = getDb();
	const code = normalizeClickCode(q, await knownLinkCodes(db));

	await db
		.prepare('INSERT INTO clicks (code, ts, platform, referer) VALUES (?, ?, ?, ?)')
		.bind(code, new Date().toISOString(), platform, referer)
		.run();

	return { code, platform, waUrl: waMeUrl(PUBLIC_WA_NUMBER) };
});
