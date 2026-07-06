import { resolveWaUrl } from '$lib/server/wa';
import type { PageServerLoad } from './$types';

// Server-only load: the direct wa.me link is resolved at runtime through the
// BOT service binding (platform.env), which isn't available on the client.
// No click logging here — the form is the fallback, not a tracked entry point.
// We only need the chat link for the "actually, WhatsApp is better" nudge.
export const load: PageServerLoad = async () => ({
	waUrl: await resolveWaUrl()
});
