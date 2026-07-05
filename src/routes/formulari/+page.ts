import { PUBLIC_WA_NUMBER, PUBLIC_WA_PREFILL } from '$env/static/public';
import { waMeUrl } from '$lib/wa';
import type { PageLoad } from './$types';

// No click logging here — the form is the fallback, not a tracked entry point.
// We only need the wa.me link for the "actually, WhatsApp is better" nudge.
export const load: PageLoad = () => ({
	waUrl: waMeUrl(PUBLIC_WA_NUMBER, PUBLIC_WA_PREFILL)
});
