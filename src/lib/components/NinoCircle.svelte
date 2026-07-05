<script lang="ts">
	import Nino from './Nino.svelte';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	// A little sardana rotllana: a few ninos with different poses, gently swaying.
	const dancers: { pose: 1 | 2 | 3 | 4; delay: string }[] = [
		{ pose: 2, delay: '0s' },
		{ pose: 1, delay: '0.18s' },
		{ pose: 3, delay: '0.36s' },
		{ pose: 4, delay: '0.54s' },
		{ pose: 1, delay: '0.72s' }
	];
</script>

<div
	class="sardana {className}"
	role="img"
	aria-label="Uns quants ninos ballant sardanes agafats de la mà"
>
	{#each dancers as dancer, i (i)}
		<span class="dancer" style="animation-delay:{dancer.delay}" aria-hidden="true">
			<Nino pose={dancer.pose} />
		</span>
	{/each}
</div>

<style>
	.sardana {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		color: var(--color-ink);
	}
	.dancer {
		display: block;
		width: clamp(3.75rem, 17vw, 8rem);
		margin-inline: -0.4rem;
		animation: sway 2.6s ease-in-out infinite;
		transform-origin: bottom center;
	}
	.dancer :global(svg) {
		display: block;
		width: 100%;
		height: auto;
	}
	@keyframes sway {
		0%,
		100% {
			transform: translateY(0) rotate(-3deg);
		}
		50% {
			transform: translateY(-0.5rem) rotate(3deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.dancer {
			animation: none;
		}
	}
</style>
