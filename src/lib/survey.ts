// Shared, framework-agnostic survey constants. Kept out of the *.remote.ts file
// because remote modules may only export remote functions.

// The same 5 availability buckets as the WhatsApp bot flow, plus a free-text
// escape hatch ('custom'), whose raw text is stored in `availability_raw`.
export const AVAILABILITY = [
	'dissabtes',
	'diumenges',
	'entre-setmana',
	'depen',
	'igual',
	'custom'
] as const;
export type Availability = (typeof AVAILABILITY)[number];

export const AVAILABILITY_LABELS: Record<Availability, string> = {
	dissabtes: 'Els dissabtes',
	diumenges: 'Els diumenges',
	'entre-setmana': 'Entre setmana',
	depen: 'Depèn del cap de setmana',
	igual: "M'és igual, tot em va bé",
	custom: 'Una altra cosa…'
};

// Real association contact details (from landing-barrakudes).
export const ASSOCIATION_EMAIL = 'hola@barrakudesbegur.org';
export const INSTAGRAM_HANDLE = '@barrakudesbegur';
