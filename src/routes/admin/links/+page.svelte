<script lang="ts">
	import { resolve } from '$app/paths';
	import { SITE_URL } from '$lib/site';
	import { qrSvg } from '$lib/qr';
	import { downloadQrSvg, downloadQrPng } from '$lib/qr-download';
	import { listLinks, createLink, setArchived } from './links.remote';

	// The tracked-link URL a QR should encode (owner-decided /go?q= format).
	function linkUrl(code: string): string {
		return `${SITE_URL}/go?q=${code}`;
	}
</script>

<svelte:head>
	<title>Enllaços i QR · Curs de sardanes</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="mx-auto flex min-h-dvh max-w-2xl flex-col gap-5 px-4 py-8">
	<header class="flex items-center gap-3 border-b-4 border-brand pb-3">
		<h1 class="font-title text-3xl text-brand">Enllaços i QR</h1>
		<a class="ml-auto text-sm font-bold text-brand underline" href={resolve('/admin')}>← Panell</a>
	</header>

	<!-- Create -->
	<section class="rounded-2xl border border-neutral-200 bg-white p-4">
		<h2 class="font-title text-xl text-brand">Nou enllaç</h2>
		<form {...createLink} class="mt-3 flex flex-col gap-3">
			<div class="flex flex-col gap-1">
				<label class="text-sm font-bold" for="code">Codi (curt, per la URL)</label>
				{#each createLink.fields.code.issues() ?? [] as issue, i (i)}
					<p class="text-sm text-red-600">{issue.message}</p>
				{/each}
				<input
					id="code"
					{...createLink.fields.code.as('text')}
					placeholder="p3"
					class="rounded-xl border-2 border-neutral-300 px-3 py-2 focus:border-brand focus:outline-none"
				/>
			</div>
			<div class="flex flex-col gap-1">
				<label class="text-sm font-bold" for="label">Etiqueta</label>
				{#each createLink.fields.label.issues() ?? [] as issue, i (i)}
					<p class="text-sm text-red-600">{issue.message}</p>
				{/each}
				<input
					id="label"
					{...createLink.fields.label.as('text')}
					placeholder="Cartell · Plaça de la Vila"
					class="rounded-xl border-2 border-neutral-300 px-3 py-2 focus:border-brand focus:outline-none"
				/>
			</div>
			<button
				type="submit"
				class="self-start rounded-full bg-brand px-5 py-2 font-bold text-white hover:bg-brand-dark"
			>
				Crea l'enllaç
			</button>
		</form>
	</section>

	<!-- List -->
	<svelte:boundary>
		{#each await listLinks() as link (link.code)}
			<section
				class="rounded-2xl border border-neutral-200 bg-white p-4 {link.archived
					? 'opacity-60'
					: ''}"
			>
				<div class="flex items-start gap-3">
					<div class="min-w-0 flex-1">
						<h3 class="font-title text-lg text-brand">{link.label}</h3>
						<!-- Absolute production URL on purpose: it must match what the QR encodes. -->
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a class="block truncate text-sm text-neutral-600 underline" href={linkUrl(link.code)}>
							{linkUrl(link.code)}
						</a>
						<p class="mt-1 text-sm">
							<strong>{link.clicks}</strong> clic{link.clicks === 1 ? '' : 's'}
							{#if link.archived}· <span class="text-neutral-500">arxivat</span>{/if}
						</p>
					</div>
					<!-- QR preview -->
					<div class="w-20 shrink-0" aria-hidden="true">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html qrSvg(linkUrl(link.code))}
					</div>
				</div>

				<div class="mt-3 flex flex-wrap gap-2">
					<button
						class="rounded-full border-2 border-brand px-3 py-1 text-sm font-bold text-brand"
						onclick={() => downloadQrSvg(linkUrl(link.code), `qr-${link.code}`)}
					>
						QR SVG
					</button>
					<button
						class="rounded-full border-2 border-brand px-3 py-1 text-sm font-bold text-brand"
						onclick={() => downloadQrPng(linkUrl(link.code), `qr-${link.code}`)}
					>
						QR PNG
					</button>
					<form {...setArchived} class="ml-auto">
						<input type="hidden" name="code" value={link.code} />
						<input type="hidden" name="archived" value={link.archived ? 'false' : 'true'} />
						<button
							type="submit"
							class="rounded-full border-2 border-neutral-300 px-3 py-1 text-sm font-bold text-neutral-600"
						>
							{link.archived ? 'Desarxiva' : 'Arxiva'}
						</button>
					</form>
				</div>
			</section>
		{/each}

		{#snippet pending()}
			<p class="text-sm text-neutral-500">Carregant enllaços…</p>
		{/snippet}
	</svelte:boundary>
</main>
