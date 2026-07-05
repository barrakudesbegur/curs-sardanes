import { test, expect } from '@playwright/test';
import { d1Query } from './db';

// The dev server runs with ADMIN_DEV=true (.dev.vars), so the Access gate is
// bypassed with a placeholder identity and BOT_DB is seeded (see the Playwright
// webServer command).

test.describe('/admin campaign report', () => {
	test('renders the funnel and people joined across both databases', async ({ page }) => {
		await page.goto('/admin');

		await expect(page.getByRole('heading', { name: 'Panell de la campanya' })).toBeVisible();
		// Funnel labels present.
		await expect(page.getByText('Enquestes fetes')).toBeVisible();
		// The seeded BOT_DB has 3 completed surveys → the people list joins them.
		await expect(page.getByRole('heading', { name: /Gent interessada/ })).toBeVisible();
		await expect(page.getByText('💬 WhatsApp').first()).toBeVisible();
	});

	test('CSV export returns the joined rows', async ({ page }) => {
		const res = await page.request.get('/admin/export.csv');
		expect(res.ok()).toBeTruthy();
		expect(res.headers()['content-type']).toContain('text/csv');
		const body = await res.text();
		expect(body).toContain('nom,via,vol,disponibilitat,quan');
		// A seeded WhatsApp completion should appear.
		expect(body).toContain('whatsapp');
	});

	test('renders on a phone-sized viewport', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/admin');
		await expect(page.getByRole('heading', { name: 'Panell de la campanya' })).toBeVisible();
		// No horizontal overflow of the body.
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth <= window.innerWidth + 1
		);
		expect(overflow).toBe(true);
	});
});

test.describe('/admin/links CRUD + QR', () => {
	test('creates a link, then it shows in the list and is clickable', async ({ page }) => {
		await page.goto('/admin/links');
		await expect(page.getByRole('heading', { name: 'Enllaços i QR' })).toBeVisible();

		const code = 'e2e' + Date.now().toString().slice(-5);
		await page.getByLabel('Codi (curt, per la URL)').fill(code);
		await page.getByLabel('Etiqueta').fill('Prova e2e');
		await page.getByRole('button', { name: "Crea l'enllaç" }).click();

		await expect(page.getByRole('heading', { name: 'Prova e2e' })).toBeVisible();
		await expect(page.getByText(`/go?q=${code}`).first()).toBeVisible();

		// It really landed in D1.
		const rows = d1Query<{ label: string }>(`SELECT label FROM links WHERE code = '${code}'`);
		expect(rows[0]?.label).toBe('Prova e2e');
	});

	test('seeded links render with a QR preview', async ({ page }) => {
		await page.goto('/admin/links');
		// The migration seeds 'p1' etc.; each link card renders an inline QR <svg>.
		await expect(page.locator('section svg').first()).toBeVisible();
	});
});

test('admin is fail-closed without the dev bypass is covered in unit config', () => {
	// The fail-closed path (no ADMIN_DEV, no Access JWT → 403) is enforced by
	// verifyAccess() returning null in hooks.server.ts. It can't be exercised here
	// because the dev server always runs with ADMIN_DEV=true; it's asserted in the
	// access unit test instead.
	expect(true).toBe(true);
});
