// Admin authorisation via Cloudflare Access (Zero Trust).
//
// Ported from coin-reader/functions/_lib/access.ts. The /admin section sits
// behind a Cloudflare Access application; Access authenticates the user at the
// edge and forwards a signed JWT in `Cf-Access-Jwt-Assertion`. We verify the
// SIGNATURE here (not just trust the header) — that's what prevents spoofing.
//
// FAILS CLOSED: with no team/AUD configured (and no dev bypass), every request
// is refused. Local dev sets ADMIN_DEV=true in .dev.vars (there is no Access in
// front of `vite dev`).

import { createRemoteJWKSet, jwtVerify } from 'jose';

/** The subset of `platform.env` this module reads (generated Env is a superset). */
export interface AccessEnv {
	ADMIN_DEV?: string;
	CF_ACCESS_TEAM_DOMAIN?: string;
	CF_ACCESS_AUD?: string;
	CF_ACCESS_EMAIL_DOMAIN?: string;
}

export interface AccessIdentity {
	email: string;
}

// One JWKS resolver per team domain, reused across requests in this isolate.
// jose caches the fetched keys internally with a cooldown.
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
function jwks(teamDomain: string): ReturnType<typeof createRemoteJWKSet> {
	let resolver = jwksCache.get(teamDomain);
	if (!resolver) {
		resolver = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));
		jwksCache.set(teamDomain, resolver);
	}
	return resolver;
}

/**
 * Resolve the caller's identity, or return null when the request is not
 * authorised (the caller turns that into a 403). Fails closed.
 */
export async function verifyAccess(
	request: Request,
	env: AccessEnv | undefined
): Promise<AccessIdentity | null> {
	// Local-dev bypass — NEVER set in production. Fails closed unless exactly "true".
	if (env?.ADMIN_DEV === 'true') return { email: 'dev@localhost' };

	const team = env?.CF_ACCESS_TEAM_DOMAIN;
	// Comma-separated: the production app's AUD plus (optionally) the AUD of the
	// app guarding preview deployments (see coin-reader/wrangler.toml).
	const aud = (env?.CF_ACCESS_AUD ?? '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	if (!team || aud.length === 0) return null;

	const token = request.headers.get('cf-access-jwt-assertion');
	if (!token) return null;

	try {
		const { payload } = await jwtVerify(token, jwks(team), { issuer: team, audience: aud });
		const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : '';
		if (!email) return null;

		const allowed = env?.CF_ACCESS_EMAIL_DOMAIN?.toLowerCase();
		if (allowed) {
			const suffix = allowed.startsWith('@') ? allowed : `@${allowed}`;
			if (!email.endsWith(suffix)) return null;
		}
		return { email };
	} catch {
		return null;
	}
}
