import { logClick } from '$lib/clicks.remote';
import type { PageLoad } from './$types';

// A direct visit to the pitch page is logged with the 'direct' click code,
// through the exact same path as the /go interstitial.
export const load: PageLoad = async () => {
	const { waUrl } = await logClick('direct');
	return { waUrl };
};
