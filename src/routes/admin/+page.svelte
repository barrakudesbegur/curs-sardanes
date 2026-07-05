<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const r = $derived(data.report);

	// Simple inline bar chart of clicks per day (no chart library).
	const maxDay = $derived(Math.max(1, ...r.byDay.map((d) => d.clicks)));
	const maxTotal = $derived(Math.max(1, ...r.totals.map((t) => t.clicks)));

	function shortDay(iso: string): string {
		// 'YYYY-MM-DD' -> 'DD/MM'
		const [, m, d] = iso.split('-');
		return `${d}/${m}`;
	}

	const funnelSteps = $derived([
		{ label: 'Clics', n: r.funnel.clicks },
		{ label: 'Converses', n: r.funnel.conversations },
		{ label: 'Enquestes fetes', n: r.funnel.completed },
		{ label: 'Al grup / avisar', n: r.funnel.grup + r.funnel.avisam }
	]);
	const funnelMax = $derived(Math.max(1, ...funnelSteps.map((s) => s.n)));
</script>

<svelte:head>
	<title>Panell · Curs de sardanes</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="mx-auto flex min-h-dvh max-w-2xl flex-col gap-5 px-4 py-8">
	<header class="flex flex-wrap items-center gap-x-3 gap-y-1 border-b-4 border-brand pb-3">
		<h1 class="font-title text-3xl text-brand">Panell de la campanya</h1>
		{#if data.email}<span class="text-xs text-neutral-500">{data.email}</span>{/if}
		<nav class="ml-auto flex gap-3 text-sm">
			<a class="font-bold text-brand underline" href={resolve('/admin/links')}>Enllaços i QR</a>
			<a class="font-bold text-brand underline" href="https://wa.barrakudesbegur.org/admin">
				Safata d'en Kudi ↗
			</a>
		</nav>
	</header>

	<!-- Funnel -->
	<section class="rounded-2xl border border-neutral-200 bg-white p-4">
		<h2 class="font-title text-xl text-brand">Embut</h2>
		<div class="mt-3 flex flex-col gap-2">
			{#each funnelSteps as step, i (i)}
				<div class="flex items-center gap-3">
					<span class="w-32 shrink-0 text-sm">{step.label}</span>
					<div class="h-6 flex-1 overflow-hidden rounded-full bg-cream">
						<div
							class="flex h-full items-center justify-end rounded-full bg-brand pr-2 text-xs font-bold text-white"
							style="width: {Math.max(8, (step.n / funnelMax) * 100)}%"
						>
							{step.n}
						</div>
					</div>
				</div>
			{/each}
		</div>
		<p class="mt-3 text-sm text-neutral-600">
			Del web (correu): <strong>{r.funnel.webForms}</strong> · Al grup:
			<strong>{r.funnel.grup}</strong> · Només avisar:
			<strong>{r.funnel.avisam}</strong>
		</p>
		{#if !r.botAvailable}
			<p class="mt-2 rounded-lg bg-cream px-3 py-2 text-xs text-neutral-600">
				Encara no es veuen dades d'en Kudi (la base de dades del bot no està connectada o és buida).
				Els clics i el formulari web sí que compten.
			</p>
		{/if}
	</section>

	<!-- Clicks by day -->
	<section class="rounded-2xl border border-neutral-200 bg-white p-4">
		<h2 class="font-title text-xl text-brand">Clics per dia</h2>
		{#if r.byDay.length === 0}
			<p class="mt-2 text-sm text-neutral-500">Encara no hi ha cap clic.</p>
		{:else}
			<div class="mt-3 flex h-28 items-end gap-1">
				{#each r.byDay as d (d.day)}
					<div class="flex flex-1 flex-col items-center gap-1">
						<div
							class="w-full rounded-t bg-brand"
							style="height: {(d.clicks / maxDay) * 100}%"
							title="{d.day}: {d.clicks}"
						></div>
						<span class="text-[0.6rem] text-neutral-500">{shortDay(d.day)}</span>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Totals per link -->
	<section class="rounded-2xl border border-neutral-200 bg-white p-4">
		<h2 class="font-title text-xl text-brand">Clics per enllaç</h2>
		<div class="mt-3 flex flex-col gap-2">
			{#each r.totals as t (t.code)}
				<div class="flex items-center gap-3">
					<span class="w-28 shrink-0 truncate text-sm" title={t.label ?? t.code}>
						{t.label ?? t.code}
						{#if t.archived}<span class="text-neutral-400">(arxivat)</span>{/if}
					</span>
					<div class="h-5 flex-1 overflow-hidden rounded-full bg-cream">
						<div
							class="h-full rounded-full bg-brand/70"
							style="width: {Math.max(2, (t.clicks / maxTotal) * 100)}%"
						></div>
					</div>
					<span class="w-8 shrink-0 text-right text-sm font-bold">{t.clicks}</span>
				</div>
			{/each}
		</div>
	</section>

	<!-- People -->
	<section class="rounded-2xl border border-neutral-200 bg-white p-4">
		<div class="flex items-center gap-3">
			<h2 class="font-title text-xl text-brand">Gent interessada ({r.people.length})</h2>
			<a
				class="ml-auto rounded-full border-2 border-brand px-3 py-1 text-sm font-bold text-brand"
				href={resolve('/admin/export.csv')}
			>
				Exporta CSV
			</a>
		</div>
		{#if r.people.length === 0}
			<p class="mt-2 text-sm text-neutral-500">Encara ningú. Comparteix els enllaços! 💃</p>
		{:else}
			<div class="mt-3 overflow-x-auto">
				<table class="w-full text-left text-sm">
					<thead class="text-neutral-500">
						<tr>
							<th class="py-1 pr-3 font-medium">Nom</th>
							<th class="py-1 pr-3 font-medium">Via</th>
							<th class="py-1 pr-3 font-medium">Vol</th>
							<th class="py-1 font-medium">Quan</th>
						</tr>
					</thead>
					<tbody>
						{#each r.people as p, i (i)}
							<tr class="border-t border-neutral-200">
								<td class="py-1.5 pr-3">{p.name}</td>
								<td class="py-1.5 pr-3">{p.source === 'whatsapp' ? '💬 WhatsApp' : '🌐 Web'}</td>
								<td class="py-1.5 pr-3">{p.action ?? '—'}</td>
								<td class="py-1.5">{p.availability ?? '—'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</main>
