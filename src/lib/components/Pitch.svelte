<script lang="ts">
	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
</script>

<div class="pitch {className}">
	<p>
		Als Barrakudes ens ronda pel cap muntar un
		<strong>curs per aprendre a ballar sardanes</strong>. 💃
	</p>
	<p>
		De moment és <strong>només una idea</strong>: abans de llançar-nos-hi volem saber si hi ha prou
		gent que s'hi apuntaria.
	</p>
	<p>
		Seria un curs de debò — unes quantes sessions repartides durant <strong>uns mesos</strong>, els
		<strong>caps de setmana</strong> (que és quan tothom és a Begur 😉).
	</p>
	<p>
		Si tira endavant, muntarem un <strong>grup de WhatsApp</strong> per organitzar-ho.
	</p>
</div>

<style>
	.pitch {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		font-size: 1.125rem;
		line-height: 1.6;
	}
	.pitch strong {
		color: var(--color-brand-dark);
		font-weight: 700;
	}
</style>
