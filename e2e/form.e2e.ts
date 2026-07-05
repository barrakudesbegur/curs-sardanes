import { test, expect, type Page } from '@playwright/test';
import { d1Count, d1Query } from './db';

// The remote-form inputs are controlled, so we must wait for client hydration
// before interacting — otherwise early keystrokes/clicks get reset.
async function gotoHydrated(page: Page, path: string) {
	await page.goto(path);
	await page.locator('html[data-hydrated="true"]').waitFor();
}

test.describe('/formulari fallback form', () => {
	test('requires the RGPD consent checkbox', async ({ page }) => {
		const before = d1Count('form_responses');
		await gotoHydrated(page, '/formulari');

		await page.getByLabel('Com et dius?').fill('Test Sense Consentiment');
		await page.getByRole('radio', { name: 'Els dissabtes' }).check();
		await page.getByLabel('El teu correu').fill('test@exemple.cat');
		// deliberately leave consent unchecked

		await page.getByRole('button', { name: /Compta amb mi/ }).click();

		await expect(page.getByText('Necessitem el teu vistiplau')).toBeVisible();
		await expect(page).toHaveURL(/\/formulari/);
		expect(d1Count('form_responses')).toBe(before);
	});

	test('blocks submission without an email', async ({ page }) => {
		const before = d1Count('form_responses');
		await gotoHydrated(page, '/formulari');

		await page.getByLabel('Com et dius?').fill('Test Sense Correu');
		await page.getByRole('radio', { name: 'Els dissabtes' }).check();
		await page.getByRole('checkbox').check();

		await page.getByRole('button', { name: /Compta amb mi/ }).click();

		// Whether the browser's native `required` check or the server-side rule
		// catches it first, the submission must not go through.
		await expect(page).toHaveURL(/\/formulari/);
		expect(d1Count('form_responses')).toBe(before);
	});

	test('rejects a malformed email', async ({ page }) => {
		await gotoHydrated(page, '/formulari');

		await page.getByLabel('Com et dius?').fill('Test Correu Dolent');
		await page.getByRole('radio', { name: 'Els dissabtes' }).check();
		await page.getByLabel('El teu correu').fill('no-es-un-correu');
		await page.getByRole('checkbox').check();

		await page.getByRole('button', { name: /Compta amb mi/ }).click();

		// The `type="email"` input's native validation blocks the submit before it
		// ever leaves the browser (the server regex is a backend backstop).
		await expect(page).toHaveURL(/\/formulari/);
		const valid = await page
			.getByLabel('El teu correu')
			.evaluate((el) => (el as HTMLInputElement).validity.valid);
		expect(valid).toBe(false);
	});

	test('links to the privacy policy from the consent text', async ({ page }) => {
		await gotoHydrated(page, '/formulari');

		await page
			.getByRole('link', { name: /política de privacitat/i })
			.first()
			.click();

		await expect(page).toHaveURL(/\/privacitat/);
		await expect(page.getByRole('heading', { name: /Política de privacitat/ })).toBeVisible();
		await expect(page.getByText('hola@barrakudesbegur.org').first()).toBeVisible();
	});

	test('submits, reaches /gracies and writes a contactable row', async ({ page }) => {
		const before = d1Count('form_responses');

		await gotoHydrated(page, '/formulari');
		await page.getByLabel('Com et dius?').fill('Roseta Interessada');
		await page.getByRole('radio', { name: 'Els diumenges' }).check();
		await page.getByLabel('El teu correu').fill('roseta@exemple.cat');
		await page.getByLabel(/El teu WhatsApp/).fill('+34 600 123 123');
		await page.getByRole('checkbox').check();

		await page.getByRole('button', { name: /Compta amb mi/ }).click();

		await expect(page).toHaveURL(/\/gracies/);
		await expect(page.getByRole('heading', { name: /Gràcies/ })).toBeVisible();

		expect(d1Count('form_responses')).toBe(before + 1);

		const rows = d1Query<{
			name: string;
			availability: string;
			email: string;
			phone: string;
			consent: number;
		}>(
			"SELECT name, availability, email, phone, consent FROM form_responses WHERE name = 'Roseta Interessada' ORDER BY id DESC LIMIT 1"
		);
		expect(rows[0]).toMatchObject({
			name: 'Roseta Interessada',
			availability: 'diumenges',
			email: 'roseta@exemple.cat',
			phone: '+34 600 123 123',
			consent: 1
		});
	});

	test("stores free-text availability for the 'una altra cosa' option", async ({ page }) => {
		await gotoHydrated(page, '/formulari');
		await page.getByLabel('Com et dius?').fill('Pau Divendres');
		await page.getByRole('radio', { name: 'Una altra cosa…' }).check();
		await page.getByLabel("Explica'ns quan").fill('els divendres a la tarda');
		await page.getByLabel('El teu correu').fill('pau@exemple.cat');
		await page.getByRole('checkbox').check();

		await page.getByRole('button', { name: /Compta amb mi/ }).click();
		await expect(page).toHaveURL(/\/gracies/);

		const rows = d1Query<{ availability: string; availability_raw: string; phone: string | null }>(
			"SELECT availability, availability_raw, phone FROM form_responses WHERE name = 'Pau Divendres' ORDER BY id DESC LIMIT 1"
		);
		expect(rows[0]).toMatchObject({
			availability: 'custom',
			availability_raw: 'els divendres a la tarda',
			phone: null
		});
	});
});
