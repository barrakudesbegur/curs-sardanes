import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			// SvelteKit config is passed inline (supported since @sveltejs/kit 2.62)
			// rather than via svelte.config.js. Kit options (adapter,
			// experimental.remoteFunctions) sit at the top level; `compilerOptions`
			// is forwarded to the Svelte compiler.
			adapter: adapter(),
			// Opt in to remote functions (query/form/command in *.remote.ts files).
			experimental: {
				remoteFunctions: true
			},
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
				// Allow top-level `await` in components (needed to await remote functions).
				experimental: {
					async: true
				}
			}
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
