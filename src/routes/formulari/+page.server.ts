import { waMeUrl } from '$lib/wa';
import { getWaNumber } from '$lib/server/db';
import type { PageServerLoad } from './$types';

// Server-only load: the wa.me number is a runtime Cloudflare var (platform.env),
// which isn't available on the client — so this can't be a universal `+page.ts`.
// No click logging here — the form is the fallback, not a tracked entry point.
// We only need the wa.me link for the "actually, WhatsApp is better" nudge.
export const load: PageServerLoad = () => ({
	waUrl: waMeUrl(getWaNumber())
});
