<script lang="ts">
	import { resolve } from '$app/paths';
	import Nino from '$lib/components/Nino.svelte';
	import { INSTAGRAM_HANDLE } from '$lib/survey';
</script>

<svelte:head>
	<title>Gràcies! · Curs de sardanes</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main
	class="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-7 px-6 py-14 text-center"
	data-testid="gracies"
>
	<Nino pose={3} class="w-40 text-brand" />
	<h1 class="font-title text-6xl text-brand">Gràcies! 🎉</h1>
	<p class="text-lg">
		Ja ho tenim apuntat. Quan sapiguem si el curs tira endavant,
		<strong>t'ho farem saber</strong>. Gràcies per fer poble! 🧡
	</p>
	<p class="text-base text-neutral-600">
		Mentrestant, segueix-nos a l'Instagram
		<a
			class="font-bold text-brand underline"
			href="https://instagram.com/barrakudesbegur"
			target="_blank"
			rel="noopener">{INSTAGRAM_HANDLE}</a
		>.
	</p>
	<a
		href={resolve('/')}
		class="text-sm text-neutral-500 underline underline-offset-2 hover:text-neutral-700"
	>
		Torna a l'inici
	</a>
</main>
