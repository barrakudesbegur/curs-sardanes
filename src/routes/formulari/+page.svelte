<script lang="ts">
	import { resolve } from '$app/paths';
	import { submitForm } from './form.remote';
	import { AVAILABILITY, AVAILABILITY_LABELS } from '$lib/survey';
	import { waChatUrl } from '$lib/wa';
	import Nino from '$lib/components/Nino.svelte';

	const fields = submitForm.fields;
	// Reactive current value, used to reveal the free-text availability input.
	const availability = $derived(fields.availability.value());
</script>

<svelte:head>
	<title>Apunta-t'hi per correu · Curs de sardanes</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="mx-auto flex min-h-dvh max-w-xl flex-col gap-8 px-6 py-14">
	<header class="flex flex-col items-center gap-4 text-center">
		<Nino pose={2} class="w-24" />
		<h1 class="font-title text-4xl text-brand">Apunta-t'hi per correu</h1>
		<p class="text-lg">
			El més ràpid és parlar amb en Kudi per <strong>WhatsApp</strong> 💬 Però si no en tens, cap problema:
			deixa'ns el correu i quan sapiguem si el curs es fa, t'escrivim.
		</p>
		<a
			href={waChatUrl()}
			rel="external"
			class="inline-flex items-center gap-2 rounded-full border-2 border-brand px-5 py-2 text-sm font-bold text-brand transition hover:bg-brand/10"
		>
			Millor parlo amb en Kudi 💬
		</a>
	</header>

	<form {...submitForm} class="flex flex-col gap-7">
		<!-- Nom -->
		<div class="flex flex-col gap-2">
			<label class="font-bold" for="camp-nom">Com et dius?</label>
			{#each fields.nom.issues() ?? [] as issue, i (i)}
				<p class="text-sm text-red-600">{issue.message}</p>
			{/each}
			<input
				id="camp-nom"
				{...fields.nom.as('text')}
				placeholder="El teu nom"
				class="rounded-xl border-2 border-neutral-300 px-4 py-3 focus:border-brand focus:outline-none"
			/>
		</div>

		<!-- Disponibilitat -->
		<fieldset class="flex flex-col gap-2">
			<legend class="mb-1 font-bold">Quan et sol anar bé?</legend>
			{#each fields.availability.issues() ?? [] as issue, i (i)}
				<p class="text-sm text-red-600">{issue.message}</p>
			{/each}
			{#each AVAILABILITY as value (value)}
				<label class="flex items-center gap-3 rounded-xl border-2 border-neutral-200 px-4 py-3">
					<input {...fields.availability.as('radio', value)} class="size-5 accent-brand" />
					<span>{AVAILABILITY_LABELS[value]}</span>
				</label>
			{/each}
		</fieldset>

		<!-- Disponibilitat lliure (només per a "una altra cosa") -->
		{#if availability === 'custom'}
			<div class="flex flex-col gap-2">
				<label class="font-bold" for="camp-quan">Explica'ns quan</label>
				{#each fields.availabilityRaw.issues() ?? [] as issue, i (i)}
					<p class="text-sm text-red-600">{issue.message}</p>
				{/each}
				<input
					id="camp-quan"
					{...fields.availabilityRaw.as('text')}
					placeholder="Per exemple: els divendres a la tarda"
					class="rounded-xl border-2 border-neutral-300 px-4 py-3 focus:border-brand focus:outline-none"
				/>
			</div>
		{/if}

		<!-- Correu (sempre: la raó de ser del formulari és poder-te avisar) -->
		<div class="flex flex-col gap-2">
			<label class="font-bold" for="camp-email">El teu correu</label>
			<p class="text-sm text-neutral-500">Només el farem servir per avisar-te del curs 📮</p>
			{#each fields.email.issues() ?? [] as issue, i (i)}
				<p class="text-sm text-red-600">{issue.message}</p>
			{/each}
			<input
				id="camp-email"
				{...fields.email.as('email')}
				placeholder="tu@exemple.cat"
				class="rounded-xl border-2 border-neutral-300 px-4 py-3 focus:border-brand focus:outline-none"
			/>
		</div>

		<!-- WhatsApp (opcional): per si en té però l'enllaç wa.me no ha funcionat -->
		<div class="flex flex-col gap-2">
			<label class="font-bold" for="camp-whatsapp">
				El teu WhatsApp <span class="font-normal text-neutral-500">(opcional)</span>
			</label>
			<p class="text-sm text-neutral-500">
				Que sí que en tens però l'enllaç no t'ha funcionat? Deixa'ns el número i, si el curs es fa,
				t'escrivim per allà 💬
			</p>
			{#each fields.phone.issues() ?? [] as issue, i (i)}
				<p class="text-sm text-red-600">{issue.message}</p>
			{/each}
			<input
				id="camp-whatsapp"
				{...fields.phone.as('tel')}
				placeholder="600 00 00 00"
				class="rounded-xl border-2 border-neutral-300 px-4 py-3 focus:border-brand focus:outline-none"
			/>
		</div>

		<!-- Consentiment RGPD -->
		<div class="flex flex-col gap-2">
			{#each fields.consent.issues() ?? [] as issue, i (i)}
				<p class="text-sm text-red-600">{issue.message}</p>
			{/each}
			<label class="flex items-start gap-3 rounded-xl bg-cream px-4 py-3">
				<input {...fields.consent.as('checkbox')} class="mt-1 size-5 accent-brand" />
				<span class="text-sm">
					Accepto que els Barrakudes guardin aquestes dades per avisar-me del curs, tal com explica
					la
					<a class="underline" href={resolve('/privacitat')}>política de privacitat</a>.
				</span>
			</label>
		</div>

		<button
			type="submit"
			class="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
		>
			Compta amb mi! 🎉
		</button>
	</form>
</main>
