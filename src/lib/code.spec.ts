import { describe, it, expect } from 'vitest';
import { isValidCodeFormat, normalizeClickCode } from './code';

const known = new Set(['p1', 'ig', 'direct']);

describe('isValidCodeFormat', () => {
	it('accepts short url-safe codes', () => {
		expect(isValidCodeFormat('p1')).toBe(true);
		expect(isValidCodeFormat('noticia')).toBe(true);
		expect(isValidCodeFormat('a_b-2')).toBe(true);
	});

	it('rejects empty, spaced, or over-long codes', () => {
		expect(isValidCodeFormat('')).toBe(false);
		expect(isValidCodeFormat('has space')).toBe(false);
		expect(isValidCodeFormat('a'.repeat(41))).toBe(false);
	});
});

describe('normalizeClickCode', () => {
	it('returns a known, well-formed code unchanged', () => {
		expect(normalizeClickCode('p1', known)).toBe('p1');
		expect(normalizeClickCode('direct', known)).toBe('direct');
	});

	it("logs missing/empty q as 'unknown:'", () => {
		expect(normalizeClickCode(null, known)).toBe('unknown:');
		expect(normalizeClickCode(undefined, known)).toBe('unknown:');
		expect(normalizeClickCode('', known)).toBe('unknown:');
	});

	it("logs unrecognized codes as 'unknown:<raw>'", () => {
		expect(normalizeClickCode('zzz', known)).toBe('unknown:zzz');
		expect(normalizeClickCode('p1 ', known)).toBe('unknown:p1 ');
	});

	it('accepts an iterable of known codes, not just a Set', () => {
		expect(normalizeClickCode('ig', ['ig', 'p1'])).toBe('ig');
	});

	it('truncates the echoed raw value', () => {
		const raw = 'x'.repeat(200);
		expect(normalizeClickCode(raw, known)).toBe('unknown:' + 'x'.repeat(64));
	});
});
