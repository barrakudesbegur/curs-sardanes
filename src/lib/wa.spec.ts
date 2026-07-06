import { describe, it, expect } from 'vitest';
import { waChatUrl, waMeFromLocation, WA_PREFILL, WA_CHAT_HOST } from './wa';

describe('waChatUrl', () => {
	it('points at the bot host, not wa.me — this repo knows no phone number', () => {
		const url = new URL(waChatUrl('hola'));
		expect(url.origin).toBe(WA_CHAT_HOST);
		expect(url.pathname).toBe('/');
	});

	it('URL-encodes the prefill (spaces, accents, emoji); leaves url-safe apostrophes', () => {
		expect(waChatUrl("Explica'm això del curs de sardanes 💃")).toBe(
			"https://wa.barrakudesbegur.org/?text=Explica'm%20aix%C3%B2%20del%20curs%20de%20sardanes%20%F0%9F%92%83"
		);
	});

	it('round-trips the prefill through the decoded query param; defaults to WA_PREFILL', () => {
		const prefill = "Explica'm això del curs de sardanes 💃";
		expect(new URL(waChatUrl(prefill)).searchParams.get('text')).toBe(prefill);
		expect(new URL(waChatUrl()).searchParams.get('text')).toBe(WA_PREFILL);
	});
});

describe('waMeFromLocation', () => {
	it('accepts a real wa.me target, prefill and all', () => {
		const location = 'https://wa.me/34612345678?text=Explica%27m+aix%C3%B2';
		expect(waMeFromLocation(location)).toBe(location);
	});

	it("rejects the bot's no-Meta fallback and anything that isn't wa.me", () => {
		expect(waMeFromLocation('https://barrakudesbegur.org/')).toBeNull();
		expect(waMeFromLocation('https://evil.example/wa.me')).toBeNull();
	});

	it('rejects missing or malformed Location headers', () => {
		expect(waMeFromLocation(null)).toBeNull();
		expect(waMeFromLocation('not a url')).toBeNull();
	});
});
