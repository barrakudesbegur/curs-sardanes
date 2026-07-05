import { logClick } from '$lib/clicks.remote';
import type { PageLoad } from './$types';

// The interstitial logs the click server-side during SSR (so it counts even
// without client JS) and returns the resolved platform + WhatsApp target.
export const load: PageLoad = async ({ url }) => {
	const q = url.searchParams.get('q');
	return await logClick(q);
};
