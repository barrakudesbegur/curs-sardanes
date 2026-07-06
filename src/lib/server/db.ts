import { getRequestEvent } from '$app/server';

/**
 * Returns this app's D1 database (`DB` binding). Only callable inside a request
 * context (remote functions, load, hooks). Throws loudly if the binding is
 * missing so misconfiguration fails fast rather than silently dropping data.
 */
export function getDb(): D1Database {
	const db = getRequestEvent().platform?.env?.DB;
	if (!db) {
		throw new Error('D1 binding "DB" is not available on platform.env');
	}
	return db;
}

/**
 * The whatsapp-bot database (`BOT_DB` binding), read-only by convention, used by
 * the admin funnel. Returns `undefined` when the binding isn't present so the
 * report can degrade gracefully instead of throwing.
 */
export function getBotDb(): D1Database | undefined {
	return getRequestEvent().platform?.env?.BOT_DB;
}

/** Set of non-archived link codes, used to tell known links from `unknown:` ones. */
export async function knownLinkCodes(db: D1Database): Promise<Set<string>> {
	const { results } = await db
		.prepare('SELECT code FROM links WHERE archived = 0')
		.all<{ code: string }>();
	return new Set(results.map((r) => r.code));
}
