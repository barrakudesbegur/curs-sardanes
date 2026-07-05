<script lang="ts">
	import { resolve } from '$app/paths';
	import { ASSOCIATION_EMAIL } from '$lib/survey';
</script>

<svelte:head>
	<title>Política de privacitat · Curs de sardanes</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-6 py-14">
	<h1 class="font-title text-4xl text-brand">Política de privacitat</h1>

	<p>
		Som els <strong>Barrakudes de Begur</strong>, l'associació de joves de Begur (<a
			class="underline"
			href="https://barrakudesbegur.org">barrakudesbegur.org</a
		>). Aquesta campanya serveix per saber si hi ha prou gent per muntar un curs de sardanes. Per a
		qualsevol dubte sobre les teves dades, escriu-nos a
		<a class="underline" href="mailto:{ASSOCIATION_EMAIL}">{ASSOCIATION_EMAIL}</a>.
	</p>

	<section class="flex flex-col gap-2">
		<h2 class="font-title text-2xl text-brand">Quines dades recollim</h2>
		<ul class="flex list-disc flex-col gap-2 pl-5">
			<li>
				<strong>Formulari web:</strong> el teu nom, el teu correu, el teu número de WhatsApp si ens el
				deixes, i quan et va bé fer el curs.
			</li>
			<li>
				<strong>WhatsApp (en Kudi):</strong> el teu número de telèfon, el nom del teu perfil i els missatges
				que intercanvies amb en Kudi.
			</li>
			<li>
				<strong>Enllaços i QRs de la campanya:</strong> quan n'obres un, apuntem de quin cartell o xarxa
				venies, si feies servir mòbil o ordinador, i el moment. Res més: no fem servir galetes de seguiment
				ni guardem la teva adreça IP.
			</li>
		</ul>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="font-title text-2xl text-brand">Per a què les fem servir</h2>
		<ul class="flex list-disc flex-col gap-2 pl-5">
			<li>Per avisar-te quan sapiguem si el curs tira endavant i, si es fa, per organitzar-lo.</li>
			<li>Per comptar quanta gent hi està interessada, sempre amb números agregats.</li>
		</ul>
		<p>
			Res més: ni publicitat, ni cedir-les a tercers, ni vendre-les. La base legal és el teu
			consentiment — la casella que marques al formulari o escriure voluntàriament a en Kudi.
		</p>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="font-title text-2xl text-brand">On es guarden</h2>
		<p>
			A la nostra base de dades, sobre infraestructura de Cloudflare. Les converses amb en Kudi
			passen per WhatsApp (Meta), com qualsevol altre xat de WhatsApp. Quan en Kudi fa servir
			intel·ligència artificial per entendre un missatge, el missatge es processa a Cloudflare i no
			s'utilitza per entrenar cap model.
		</p>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="font-title text-2xl text-brand">Quant de temps</h2>
		<p>
			Fins que anunciem si el curs es fa o no. Si es fa, les mantenim mentre duri l'organització. En
			tot cas, les esborrem com a màxim 6 mesos després que ja no siguin necessàries.
		</p>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="font-title text-2xl text-brand">Els teus drets</h2>
		<p>
			Pots demanar-nos veure, corregir o esborrar les teves dades quan vulguis (drets d'accés,
			rectificació, supressió i oposició):
		</p>
		<ul class="flex list-disc flex-col gap-2 pl-5">
			<li>
				Escriu-nos a
				<a class="underline" href="mailto:{ASSOCIATION_EMAIL}">{ASSOCIATION_EMAIL}</a>, o
			</li>
			<li>
				digues-li directament a en Kudi per WhatsApp: <em>«esborra les meves dades»</em>, i ho farà.
			</li>
		</ul>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="font-title text-2xl text-brand">Codi obert</h2>
		<p>
			Aquesta web i en Kudi són codi lliure: pots veure exactament què fem amb les dades al
			<a class="underline" href="https://github.com/barrakudesbegur/curs-sardanes"
				>codi font de la web</a
			>
			i al del
			<a class="underline" href="https://github.com/barrakudesbegur/whatsapp-bot">bot</a>.
		</p>
	</section>

	<p class="text-sm text-neutral-500">Última actualització: 5 de juliol de 2026</p>

	<a
		href={resolve('/')}
		class="text-sm text-neutral-500 underline underline-offset-2 hover:text-neutral-700"
	>
		Torna a l'inici
	</a>
</main>
