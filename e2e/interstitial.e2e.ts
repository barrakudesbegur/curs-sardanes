import { test, expect, devices } from '@playwright/test';
import { d1Count } from './db';

// The interstitial's mobile flow only kicks in for a mobile UA.
// Pixel 5 is a chromium-based device profile (iPhone would require the WebKit
// browser binary).
test.use(devices['Pixel 5']);

test.describe('/go interstitial (mobile)', () => {
	test('logs a known click and shows the fallback UI when the redirect is stubbed', async ({
		page
	}) => {
		const before = d1Count("clicks WHERE code = 'p1'");

		// Stub the WhatsApp redirect to a no-op and shorten the non-departure
		// heuristic so we don't wait the full ~2s.
		await page.addInitScript(() => {
			(window as unknown as { __waRedirect: () => void }).__waRedirect = () => {};
			(window as unknown as { __waFallbackDelay: number }).__waFallbackDelay = 200;
		});

		await page.goto('/go?q=p1');

		// Because the redirect was a no-op, the page never departs and morphs into
		// the fallback UI.
		await expect(page.getByTestId('wa-fallback')).toBeVisible();
		await expect(page.getByText("No s'ha obert WhatsApp")).toBeVisible();
		await expect(page.getByRole('button', { name: 'Torna-ho a provar' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Omple el formulari' })).toBeVisible();

		// The click was logged server-side during SSR.
		const after = d1Count("clicks WHERE code = 'p1'");
		expect(after).toBe(before + 1);
	});

	test('logs an unknown code as unknown:<raw> and still renders', async ({ page }) => {
		const before = d1Count("clicks WHERE code = 'unknown:zzz'");

		await page.addInitScript(() => {
			(window as unknown as { __waRedirect: () => void }).__waRedirect = () => {};
			(window as unknown as { __waFallbackDelay: number }).__waFallbackDelay = 150;
		});

		await page.goto('/go?q=zzz');
		await expect(page.getByTestId('wa-fallback')).toBeVisible();

		const after = d1Count("clicks WHERE code = 'unknown:zzz'");
		expect(after).toBe(before + 1);
	});
});
