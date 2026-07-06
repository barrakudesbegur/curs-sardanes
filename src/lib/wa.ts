/**
 * The prefilled WhatsApp message: the conversation opener Kudi receives. The
 * bot is AI-first (no trigger phrases, no exact-match anything), so this can
 * change freely — keeping it on-topic just gives a warmer first reply.
 * Hardcoded (not an env var) because it's copy, not configuration.
 */
export const WA_PREFILL = "Explica'm això del curs de sardanes 💃";

/**
 * The bot's public chat entry point: the whatsapp-bot Worker's index, which
 * accepts the same query params as wa.me (`?text=` = the prefilled message)
 * and 302-forwards to the bot's real wa.me link (number resolved from Meta at
 * runtime, on the bot's side). Indirecting through it means this repo never
 * needs to know the phone number — no config, nothing to rotate here.
 */
export const WA_CHAT_HOST = 'https://wa.barrakudesbegur.org';

/**
 * Builds the WhatsApp chat link with the prefilled message URL-encoded, in the
 * exact shape a wa.me link would take (`?text=`). Pure and env-free, so it is
 * trivial to unit-test. `prefill` defaults to the shared constant.
 */
export function waChatUrl(prefill: string = WA_PREFILL): string {
	return `${WA_CHAT_HOST}/?text=${encodeURIComponent(prefill)}`;
}

/**
 * Extracts a usable DIRECT wa.me link from the bot index's redirect Location
 * header. Only a real wa.me target counts: while the Meta setup is missing the
 * bot 302s to the association site instead, and that must not become the chat
 * link. Pure so it is trivial to unit-test; null means "keep the indirect
 * wa.barrakudesbegur.org URL".
 */
export function waMeFromLocation(location: string | null): string | null {
	if (!location) return null;
	try {
		return new URL(location).hostname === 'wa.me' ? location : null;
	} catch {
		return null;
	}
}
