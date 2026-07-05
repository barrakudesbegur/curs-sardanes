/** Allowed shape for a link code: short and URL-safe. */
const CODE_RE = /^[a-zA-Z0-9_-]{1,40}$/;

/** Max length of a raw value echoed into an `unknown:<raw>` log entry. */
const MAX_RAW = 64;

export function isValidCodeFormat(raw: string): boolean {
	return CODE_RE.test(raw);
}

/**
 * Normalizes a raw `q` value from `/go` into the value stored in `clicks.code`.
 *
 * - missing/empty          -> `'unknown:'`
 * - malformed or unknown   -> `'unknown:<raw>'` (raw truncated for safety)
 * - a known, well-formed code -> the code itself
 *
 * `knownCodes` is the set of non-archived link codes from the `links` table.
 */
export function normalizeClickCode(
	raw: string | null | undefined,
	knownCodes: Iterable<string>
): string {
	if (!raw) return 'unknown:';
	const known = knownCodes instanceof Set ? knownCodes : new Set(knownCodes);
	if (isValidCodeFormat(raw) && known.has(raw)) return raw;
	return `unknown:${raw.slice(0, MAX_RAW)}`;
}
