import { execFileSync } from 'node:child_process';
import { globSync } from 'node:fs';
import { basename } from 'node:path';

/**
 * Runs a read-only SQL statement against the LOCAL D1 database (the same
 * `.wrangler/state` sqlite that `vite dev`'s platformProxy writes to) and
 * returns the parsed rows. Reads the file directly with the sqlite3 CLI:
 * spawning `wrangler d1 execute` here would boot a second miniflare on the
 * same state dir and intermittently fail on the dev server's locks.
 */

let dbFile: string | undefined;

/**
 * Picks THIS app's local D1 sqlite. There can be several (we also seed the
 * whatsapp-bot `BOT_DB` for the admin funnel), so we identify ours by the
 * presence of the `links` table — unique to the curs-sardanes schema.
 */
function findDbFile(): string {
	const candidates = globSync('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite').filter(
		(f) => basename(f) !== 'metadata.sqlite'
	);
	if (candidates.length === 0) {
		throw new Error('No local D1 sqlite found. Run `npm run db:setup:local` first.');
	}
	for (const file of candidates) {
		try {
			const out = execFileSync(
				'sqlite3',
				[file, "SELECT name FROM sqlite_master WHERE type='table' AND name='links'"],
				{ encoding: 'utf8' }
			);
			if (out.trim() === 'links') return file;
		} catch {
			// Unreadable/locked candidate — try the next one.
		}
	}
	throw new Error(
		'Could not find the curs-sardanes D1 (no `links` table). Run `npm run db:apply:local`.'
	);
}

export function d1Query<T = Record<string, unknown>>(sql: string): T[] {
	dbFile ??= findDbFile();
	// Brief retry: a concurrent writer can hold the WAL lock for a moment.
	for (let attempt = 1; ; attempt++) {
		try {
			const stdout = execFileSync('sqlite3', ['-json', dbFile, sql], { encoding: 'utf8' });
			const trimmed = stdout.trim();
			return trimmed ? (JSON.parse(trimmed) as T[]) : [];
		} catch (err) {
			if (attempt >= 5) throw err;
			Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100 * attempt);
		}
	}
}

/** Convenience: `SELECT count(*) c ...` helper returning the count. */
export function d1Count(whereSql: string): number {
	const rows = d1Query<{ c: number }>(`SELECT count(*) c FROM ${whereSql}`);
	return rows[0].c;
}
