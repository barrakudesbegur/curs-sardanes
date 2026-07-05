import { describe, it, expect } from 'vitest';
import { verifyAccess } from './access';

function req(headers: Record<string, string> = {}): Request {
	return new Request('https://sardanes.barrakudesbegur.org/admin', { headers });
}

describe('verifyAccess (fail-closed)', () => {
	it('grants a dev identity only when ADMIN_DEV is exactly "true"', async () => {
		expect(await verifyAccess(req(), { ADMIN_DEV: 'true' })).toEqual({ email: 'dev@localhost' });
		expect(await verifyAccess(req(), { ADMIN_DEV: 'TRUE' })).toBeNull();
		expect(await verifyAccess(req(), { ADMIN_DEV: '1' })).toBeNull();
	});

	it('refuses when Access is unconfigured', async () => {
		expect(await verifyAccess(req(), {})).toBeNull();
		expect(await verifyAccess(req(), undefined)).toBeNull();
		expect(
			await verifyAccess(req(), { CF_ACCESS_TEAM_DOMAIN: 'https://x.cloudflareaccess.com' })
		).toBeNull(); // team but no AUD
	});

	it('refuses a configured app when no Access JWT is present', async () => {
		const env = {
			CF_ACCESS_TEAM_DOMAIN: 'https://barrakudesbegur.cloudflareaccess.com',
			CF_ACCESS_AUD: 'aud-1,aud-2',
			CF_ACCESS_EMAIL_DOMAIN: '@barrakudesbegur.org'
		};
		expect(await verifyAccess(req(), env)).toBeNull();
	});
});
