import { describe, it, expect } from 'vitest';
import { platformFromUA } from './ua';

const IPHONE =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const ANDROID =
	'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const MAC =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

describe('platformFromUA', () => {
	it('detects mobile user agents', () => {
		expect(platformFromUA(IPHONE)).toBe('mobile');
		expect(platformFromUA(ANDROID)).toBe('mobile');
	});

	it('treats desktop browsers as desktop', () => {
		expect(platformFromUA(MAC)).toBe('desktop');
	});

	it('falls back to desktop for missing/empty UA', () => {
		expect(platformFromUA(null)).toBe('desktop');
		expect(platformFromUA(undefined)).toBe('desktop');
		expect(platformFromUA('')).toBe('desktop');
	});
});
