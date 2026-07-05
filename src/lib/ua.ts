export type Platform = 'mobile' | 'desktop';

// Coarse mobile detection — we only need to decide between the "redirect to the
// WhatsApp app" flow and the "show a QR + WhatsApp Web" flow. Deliberately simple.
const MOBILE_RE = /Mobi|Android|iPhone|iPad|iPod|IEMobile|BlackBerry|Opera Mini|Windows Phone/i;

/**
 * Classifies a User-Agent string as `'mobile'` or `'desktop'`.
 * Missing/empty UAs fall back to `'desktop'` (the safer choice — it shows a QR
 * instead of firing a redirect that can't work).
 */
export function platformFromUA(ua: string | null | undefined): Platform {
	if (!ua) return 'desktop';
	return MOBILE_RE.test(ua) ? 'mobile' : 'desktop';
}
