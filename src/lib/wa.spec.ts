import { describe, it, expect } from 'vitest';
import { waMeUrl } from './wa';

describe('waMeUrl', () => {
	it('strips non-digits from the number', () => {
		expect(waMeUrl('+34 600 00 00 00', 'hola')).toBe('https://wa.me/34600000000?text=hola');
		expect(waMeUrl('0034-600-000-000', 'hola')).toBe('https://wa.me/0034600000000?text=hola');
	});

	it('URL-encodes the prefill (spaces, accents, emoji); leaves url-safe apostrophes', () => {
		const url = waMeUrl('34600000000', "Explica'm això del curs de sardanes 💃");
		expect(url).toBe(
			"https://wa.me/34600000000?text=Explica'm%20aix%C3%B2%20del%20curs%20de%20sardanes%20%F0%9F%92%83"
		);
	});

	it('round-trips the prefill through the decoded query param', () => {
		const prefill = "Explica'm això del curs de sardanes 💃";
		const url = new URL(waMeUrl('34600000000', prefill));
		expect(url.searchParams.get('text')).toBe(prefill);
	});
});
