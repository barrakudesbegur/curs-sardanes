/**
 * Builds a `wa.me` deep link with the prefilled message URL-encoded.
 *
 * Kept pure and env-free so it is trivial to unit-test. Callers pass the number
 * and prefill explicitly (typically from `$env/static/public`). Everything that
 * isn't a digit is stripped from `number`, so `+34 600 00 00 00`, `34600000000`
 * and `0034-600-000-000` all normalize the same way.
 */
export function waMeUrl(number: string, prefill: string): string {
	const digits = number.replace(/\D/g, '');
	return `https://wa.me/${digits}?text=${encodeURIComponent(prefill)}`;
}
