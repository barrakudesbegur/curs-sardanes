import { getRequestEvent } from '$app/server';
import { waChatUrl, waMeFromLocation } from '$lib/wa';

/**
 * Resolves the DIRECT wa.me chat link by asking the whatsapp-bot Worker (the
 * `BOT` service binding) where its index redirect points, forwarding our
 * prefill. Browsers must be handed a first-party wa.me URL: iOS refuses to
 * open the app through a cross-domain 302 (universal links deliberately don't
 * fire on redirects), and /go's "did WhatsApp open?" heuristic only means
 * something when the navigation can actually fail. The number still lives
 * nowhere in this repo — it only passes through responses at runtime.
 *
 * Any failure — binding absent (local dev/e2e without the bot running), bot
 * unreachable, or no Meta setup yet (the bot then points at the association
 * site, not wa.me) — falls back to the indirect wa.barrakudesbegur.org URL,
 * which always works, just with the extra hop.
 */

// Per-isolate cache, same pattern as the bot's own Meta lookup. A resolved
// link is kept for an hour; a failure is retried sooner so one cold-start
// hiccup doesn't pin the fallback URL for a whole hour of traffic.
let cached: { url: string | null; at: number } | null = null;
const OK_TTL_MS = 60 * 60 * 1000;
const FAIL_TTL_MS = 5 * 60 * 1000;

export async function resolveWaUrl(): Promise<string> {
	const indirect = waChatUrl();
	const ttl = cached?.url ? OK_TTL_MS : FAIL_TTL_MS;
	if (cached && Date.now() - cached.at < ttl) return cached.url ?? indirect;

	let url: string | null = null;
	try {
		const bot = getRequestEvent().platform?.env?.BOT;
		const res = await bot?.fetch(indirect, {
			redirect: 'manual',
			signal: AbortSignal.timeout(3000)
		});
		url = waMeFromLocation(res?.headers.get('location') ?? null);
	} catch {
		// Unreachable bot → fall through to the indirect URL.
	}
	cached = { url, at: Date.now() };
	return url ?? indirect;
}

/** Test hook: drop the per-isolate cache. */
export function clearWaUrlCache(): void {
	cached = null;
}
