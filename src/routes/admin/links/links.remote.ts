import * as v from 'valibot';
import { invalid } from '@sveltejs/kit';
import { query, form } from '$app/server';
import { getDb } from '$lib/server/db';
import { isValidCodeFormat } from '$lib/code';

export interface LinkRow {
	code: string;
	label: string;
	created_at: string;
	archived: number;
	clicks: number;
}

/** All links with their click counts, newest first, for the CRUD table. */
export const listLinks = query(async (): Promise<LinkRow[]> => {
	const { results } = await getDb()
		.prepare(
			`SELECT l.code, l.label, l.created_at, l.archived,
			        (SELECT COUNT(*) FROM clicks c WHERE c.code = l.code) AS clicks
			   FROM links l
			  ORDER BY l.archived ASC, l.created_at DESC`
		)
		.all<LinkRow>();
	return results ?? [];
});

/** Create a new tracked link. Code must be short and URL-safe and not exist. */
export const createLink = form(
	v.object({
		code: v.pipe(v.string(), v.trim()),
		label: v.pipe(v.string(), v.trim(), v.nonEmpty('Posa una etiqueta'))
	}),
	async ({ code, label }, issue) => {
		if (!isValidCodeFormat(code)) {
			invalid(issue.code('El codi ha de ser curt i sense espais (lletres, números, - i _).'));
		}
		const db = getDb();
		const exists = await db.prepare('SELECT 1 FROM links WHERE code = ?').bind(code).first();
		if (exists) invalid(issue.code('Ja existeix un enllaç amb aquest codi.'));

		await db
			.prepare('INSERT INTO links (code, label, created_at, archived) VALUES (?, ?, ?, 0)')
			.bind(code, label, new Date().toISOString())
			.run();
		await listLinks().refresh();
	}
);

/** Toggle a link's archived flag. */
export const setArchived = form(
	v.object({
		code: v.pipe(v.string(), v.trim()),
		archived: v.pipe(
			v.string(),
			v.transform((s) => s === 'true')
		)
	}),
	async ({ code, archived }) => {
		await getDb()
			.prepare('UPDATE links SET archived = ? WHERE code = ?')
			.bind(archived ? 1 : 0, code)
			.run();
		await listLinks().refresh();
	}
);
