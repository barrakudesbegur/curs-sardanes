/**
 * The prefilled WhatsApp message. This is NOT configuration — it is the exact
 * text the whatsapp-bot listens for as the `curs-sardanes` flow trigger, so the
 * two are coupled and must change together. Hardcoded here (not an env var) for
 * that reason; if you edit it, edit the bot's trigger in
 * `whatsapp-bot/src/flows/curs-sardanes.ts` too.
 */
export const WA_PREFILL = "Explica'm això del curs de sardanes 💃";

/**
 * Builds a `wa.me` deep link with the prefilled message URL-encoded.
 *
 * Kept pure and env-free so it is trivial to unit-test. The number is passed
 * explicitly (it genuinely varies: test number → real number). Everything that
 * isn't a digit is stripped, so `+34 600 00 00 00`, `34600000000` and
 * `0034-600-000-000` all normalize the same way. `prefill` defaults to the
 * shared constant.
 */
export function waMeUrl(number: string, prefill: string = WA_PREFILL): string {
	const digits = number.replace(/\D/g, '');
	return `https://wa.me/${digits}?text=${encodeURIComponent(prefill)}`;
}
