/**
 * The prefilled WhatsApp message. This is NOT configuration — it is the exact
 * text the whatsapp-bot listens for as the `curs-sardanes` flow trigger, so the
 * two are coupled and must change together. Hardcoded here (not an env var) for
 * that reason; if you edit it, edit the bot's trigger in
 * `whatsapp-bot/src/flows/curs-sardanes.ts` too.
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
