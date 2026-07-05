import { getDb, getBotDb } from '$lib/server/db';
import { loadReport } from '$lib/server/report';
import type { PageServerLoad } from './$types';

// Auth is enforced in hooks.server.ts (Cloudflare Access). This just loads the
// report over both databases.
export const load: PageServerLoad = async ({ locals }) => {
	const report = await loadReport(getDb(), getBotDb());
	return { report, email: locals.identity?.email ?? null };
};
