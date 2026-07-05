import { error, type Handle } from '@sveltejs/kit';
import { verifyAccess, type AccessEnv } from '$lib/server/access';

/**
 * Gate everything under /admin behind Cloudflare Access (ported from
 * coin-reader). The verified identity is stashed on `event.locals.identity` so
 * pages can show who's signed in. Fails closed: a 403 unless Access verifies
 * the request (or ADMIN_DEV bypasses locally).
 */
export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname === '/admin' || event.url.pathname.startsWith('/admin/')) {
		const env = event.platform?.env as AccessEnv | undefined;
		const identity = await verifyAccess(event.request, env);
		if (!identity) error(403, 'No tens accés a aquesta zona.');
		event.locals.identity = identity;
	}
	return resolve(event);
};
