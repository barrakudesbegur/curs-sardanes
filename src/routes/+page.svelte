<script lang="ts">
	import { resolve } from '$app/paths';
	import NinoCircle from '$lib/components/NinoCircle.svelte';
	import Pitch from '$lib/components/Pitch.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Aprenem a ballar sardanes? · Barrakudes de Begur</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh max-w-2xl flex-col items-center gap-8 px-6 py-14 text-center">
	<h1 class="font-title text-5xl leading-none text-balance text-brand sm:text-6xl">
		Aprenem a ballar sardanes?
	</h1>

	<NinoCircle class="w-full max-w-md" />

	<Pitch class="text-left" />

	<div class="mt-2 flex flex-col items-center gap-4">
		<a
			href={data.waUrl}
			rel="external"
			class="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
		>
			Parla amb en Kudi 💬
		</a>
		<a
			href={resolve('/formulari')}
			class="text-sm text-neutral-500 underline underline-offset-2 hover:text-neutral-700"
		>
			No tens WhatsApp?
		</a>
	</div>
</main>
