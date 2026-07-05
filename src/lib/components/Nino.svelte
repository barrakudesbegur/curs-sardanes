<script lang="ts">
	// Placeholder "nino" dancing sardanes, authored strictly per docs/ninos/prompt.md:
	// one continuous THICK stroke, blobby body with no straight lines, two adjacent
	// oval eyes, no mouth, short stubby jointless limbs, no fills (empty interior),
	// always mid-action (arms up as if holding hands in a sardana circle).
	// The owner replaces these with the Figma finals later.

	interface Props {
		pose?: 1 | 2 | 3 | 4;
		title?: string;
		class?: string;
	}

	let { pose = 1, title = 'Un nino ballant sardanes', class: className = '' }: Props = $props();

	// Blob body (all cubic curves — no straight lines, no corners).
	const BODY =
		'M160 64 C213 64 252 104 252 168 C252 240 220 336 160 336 C100 336 68 240 68 168 C68 104 107 64 160 64 Z';

	// Stubby arms (up) + legs (mid-step), one entry per pose for a bit of variety.
	const LIMBS: Record<1 | 2 | 3 | 4, { arms: [string, string]; legs: [string, string] }> = {
		1: {
			arms: ['M84 190 C58 168 44 138 42 104', 'M236 190 C262 168 276 138 278 104'],
			legs: ['M132 330 C126 356 120 374 112 394', 'M188 330 C194 356 202 372 212 392']
		},
		2: {
			arms: ['M88 196 C60 176 40 150 30 112', 'M232 188 C256 172 272 150 280 122'],
			legs: ['M126 330 C118 354 112 372 100 390', 'M192 332 C200 356 210 372 224 388']
		},
		3: {
			arms: ['M80 198 C48 186 28 160 20 128', 'M240 198 C272 186 292 160 300 128'],
			legs: ['M138 332 C128 356 118 372 108 396', 'M182 332 C196 354 206 368 224 384']
		},
		4: {
			arms: ['M86 188 C62 164 50 132 48 98', 'M232 192 C256 174 272 150 282 120'],
			legs: ['M134 330 C126 356 120 376 114 396', 'M190 328 C206 348 224 356 244 350']
		}
	};

	const limbs = $derived(LIMBS[pose]);
</script>

<svg
	viewBox="0 0 320 400"
	class={className}
	role="img"
	aria-label={title}
	xmlns="http://www.w3.org/2000/svg"
>
	<title>{title}</title>
	<g
		fill="none"
		stroke="currentColor"
		stroke-linecap="round"
		stroke-linejoin="round"
		vector-effect="non-scaling-stroke"
	>
		<path d={limbs.arms[0]} stroke-width="24" />
		<path d={limbs.arms[1]} stroke-width="24" />
		<path d={limbs.legs[0]} stroke-width="24" />
		<path d={limbs.legs[1]} stroke-width="24" />
		<path d={BODY} stroke-width="26" />
		<ellipse cx="134" cy="150" rx="14" ry="18" stroke-width="18" />
		<ellipse cx="186" cy="150" rx="14" ry="18" stroke-width="18" />
	</g>
</svg>
