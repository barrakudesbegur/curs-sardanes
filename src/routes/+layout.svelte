<script lang="ts">
	import './layout.css';
	import '@fontsource/londrina-solid/400.css';
	import '@fontsource/londrina-solid/900.css';
	import '@fontsource/inter/400.css';
	import '@fontsource/inter/500.css';
	import '@fontsource/inter/700.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '$lib/site';

	let { children } = $props();

	// Flag full client hydration on the <html> element. Handy as a progressive-
	// enhancement signal and, in particular, lets e2e tests wait until the
	// (controlled) remote-form inputs are interactive before touching them.
	$effect(() => {
		document.documentElement.dataset.hydrated = 'true';
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="description" content={SITE_DESCRIPTION} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Barrakudes de Begur" />
	<meta property="og:title" content={SITE_NAME} />
	<meta property="og:description" content={SITE_DESCRIPTION} />
	<meta property="og:image" content="{SITE_URL}/og.png" />
	<meta property="og:url" content={SITE_URL + page.url.pathname} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={SITE_NAME} />
	<meta name="twitter:description" content={SITE_DESCRIPTION} />
	<meta name="twitter:image" content="{SITE_URL}/og.png" />
</svelte:head>

{@render children()}

<footer class="flex flex-col items-center gap-1 px-6 pb-8 text-center text-xs text-neutral-400">
	<p>
		Fet amb 🧡 pels
		<a class="underline hover:text-neutral-600" href="https://barrakudesbegur.org">
			Barrakudes de Begur
		</a>
	</p>
	<p>
		<a class="underline hover:text-neutral-600" href={resolve('/privacitat')}>
			Política de privacitat
		</a>
		·
		<a
			class="underline hover:text-neutral-600"
			href="https://github.com/barrakudesbegur/curs-sardanes"
		>
			Codi obert
		</a>
	</p>
</footer>
