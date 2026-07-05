import { defineConfig, devices } from '@playwright/test';

// Non-default port so this can run alongside other local dev servers.
const PORT = 5191;

export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.e2e.{ts,js}',
	use: {
		baseURL: `http://localhost:${PORT}`,
		...devices['Desktop Chrome']
	},
	// `vite dev` gives us the emulated Cloudflare `platform` (local D1) via the
	// adapter's platformProxy, which is the reliable way to exercise remote
	// functions + D1 end-to-end. Migrations are applied first.
	webServer: {
		// Apply own migrations AND seed the local BOT_DB so the /admin funnel has
		// cross-database data to join.
		command: `npm run db:setup:local && npx vite dev --port ${PORT} --strictPort`,
		port: PORT,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
