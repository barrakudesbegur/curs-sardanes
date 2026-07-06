<script lang="ts">
	import { resolve } from '$app/paths';
	import Nino from '$lib/components/Nino.svelte';
	import Pitch from '$lib/components/Pitch.svelte';
	import { qrSvg } from '$lib/qr';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let showFallback = $state(false);

	const qr = $derived(data.platform === 'desktop' ? qrSvg(data.waUrl) : '');

	const btnPrimary =
		'inline-flex items-center justify-center gap-2 rounded-full bg-brand px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';
	const btnSecondary =
		'inline-flex items-center justify-center gap-2 rounded-full border-2 border-brand px-8 py-4 text-lg font-bold text-brand transition hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

	/**
	 * Sends the visitor to WhatsApp. The redirect is indirected through an
	 * optional `window.__waRedirect` hook so e2e tests can STUB it (see below):
	 * when the hook is present we call it instead of assigning `location`, which
	 * keeps the page in place and lets the non-departure heuristic fire.
	 */
	function goToWhatsApp() {
		const w = window as unknown as { __waRedirect?: (url: string) => void };
		if (typeof w.__waRedirect === 'function') {
			w.__waRedirect(data.waUrl);
		} else {
			window.location.href = data.waUrl;
		}
	}

	// Mobile: fire the redirect, then watch for "did we actually leave?". If the
	// page is still here after ~2s (no pagehide/visibility-hidden), WhatsApp
	// probably didn't open, so we morph into the fallback UI.
	//
	// Tunable from tests: `window.__waFallbackDelay` (ms) shortens the wait.
	$effect(() => {
		if (data.platform !== 'mobile') return;

		let departed = false;
		const markDeparted = () => (departed = true);
		const onVisibility = () => {
			if (document.visibilityState === 'hidden') departed = true;
		};
		window.addEventListener('pagehide', markDeparted);
		document.addEventListener('visibilitychange', onVisibility);

		const w = window as unknown as { __waFallbackDelay?: number };
		const delay = typeof w.__waFallbackDelay === 'number' ? w.__waFallbackDelay : 2000;

		const kickoff = setTimeout(goToWhatsApp, 60);
		const timer = setTimeout(() => {
			if (!departed) showFallback = true;
		}, delay);

		return () => {
			clearTimeout(kickoff);
			clearTimeout(timer);
			window.removeEventListener('pagehide', markDeparted);
			document.removeEventListener('visibilitychange', onVisibility);
		};
	});
</script>

<svelte:head>
	<title>Cap a WhatsApp… · Barrakudes de Begur</title>
	<meta name="robots" content="noindex" />
</svelte:head>

{#if data.platform === 'mobile'}
	{#if showFallback}
		<main
			class="mx-auto flex min-h-dvh max-w-xl flex-col items-center gap-6 px-6 py-14 text-center"
			data-testid="wa-fallback"
		>
			<Nino pose={4} class="w-32" />
			<h1 class="font-title text-4xl text-brand">Vaja! No s'ha obert WhatsApp 🤔</h1>
			<p class="text-lg">No passa res, ho pots tornar a provar o deixar-nos les dades:</p>
			<div class="flex w-full max-w-xs flex-col gap-3">
				<button type="button" class={btnPrimary} onclick={goToWhatsApp}>Torna-ho a provar</button>
				<a href={resolve('/formulari')} class={btnSecondary}>Omple el formulari</a>
			</div>
			<Pitch class="mt-6 text-left" />
		</main>
	{:else}
		<main
			class="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-6 px-6 py-14 text-center"
			data-testid="wa-redirecting"
		>
			<Nino pose={1} class="w-32 animate-pulse" />
			<p class="font-title text-3xl text-brand">Un moment, t'envio amb en Kudi… 💃</p>
			<!-- Both escape hatches stay visible from the start: whoever bounces off
			     WhatsApp's "download" page (no app installed) comes back here via the
			     back button, and the form must be one tap away — the non-departure
			     heuristic can't catch that case (the navigation itself succeeds). -->
			<div class="flex flex-col items-center gap-2">
				<a
					href={data.waUrl}
					rel="external"
					class="text-sm text-neutral-500 underline underline-offset-2"
				>
					Si no s'obre sol, toca aquí
				</a>
				<a
					href={resolve('/formulari')}
					class="text-sm text-neutral-500 underline underline-offset-2"
				>
					No tens WhatsApp? Omple el formulari
				</a>
			</div>
		</main>
	{/if}
{:else}
	<main class="mx-auto flex min-h-dvh max-w-xl flex-col items-center gap-7 px-6 py-14 text-center">
		<h1 class="font-title text-4xl text-brand sm:text-5xl">Parla amb en Kudi 💬</h1>
		<Pitch class="text-left" />
		<div
			class="qr rounded-2xl bg-white p-4 shadow-md"
			role="img"
			aria-label="Codi QR per obrir la conversa de WhatsApp"
		>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html qr}
		</div>
		<p class="text-lg">Escaneja el codi amb el mòbil, o obre WhatsApp aquí mateix:</p>
		<div class="flex w-full max-w-xs flex-col gap-3">
			<a href={data.waUrl} rel="external" class={btnPrimary}>Obre WhatsApp Web</a>
			<a href={resolve('/formulari')} class={btnSecondary}>No tens WhatsApp?</a>
		</div>
	</main>
{/if}

<style>
	.qr {
		width: 13rem;
		height: 13rem;
	}
	.qr :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
