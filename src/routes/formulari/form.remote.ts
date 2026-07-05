import * as v from 'valibot';
import { redirect, invalid } from '@sveltejs/kit';
import { form } from '$app/server';
import { getDb } from '$lib/server/db';
import { AVAILABILITY } from '$lib/survey';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_RE = /^\+?[\d\s().-]{7,20}$/;

/**
 * Fallback form for people without WhatsApp. Its one job is to capture a
 * *contactable* interested person (WhatsApp already captures everyone else),
 * so the email is always required. Writes one `form_responses` row and sends
 * the visitor to `/gracies`.
 *
 * NOTE: the field key is `nom`, not `name`, on purpose — a form control named
 * `name` (or `action`) shadows the `<form>` element's own DOM properties,
 * which breaks SvelteKit's enhanced submission for that field.
 */
export const submitForm = form(
	v.object({
		nom: v.pipe(v.string(), v.trim(), v.nonEmpty('Com et dius? 🙂')),
		availability: v.picklist(AVAILABILITY, "Diga'ns quan et va bé"),
		availabilityRaw: v.optional(v.string()),
		email: v.pipe(
			v.string(),
			v.trim(),
			v.nonEmpty('Posa un correu perquè et puguem avisar 📮'),
			v.regex(EMAIL_RE, 'Aquest correu no acaba de quadrar 🤔')
		),
		// Optional WhatsApp number: for people who DO have WhatsApp but the wa.me
		// redirect failed on them (group invite / phase-2 template notifications).
		phone: v.optional(v.string()),
		// Boolean form fields must be optional (unchecked checkboxes send nothing);
		// the "must be true" rule is enforced below with `invalid()`.
		consent: v.optional(v.boolean(), false)
	}),
	async (data, issue) => {
		if (!data.consent) {
			invalid(issue.consent("Necessitem el teu vistiplau per escriure't 🙏"));
		}

		const availabilityRaw = (data.availabilityRaw ?? '').trim();
		if (data.availability === 'custom' && !availabilityRaw) {
			invalid(issue.availabilityRaw("Explica'ns quan t'aniria bé ✍️"));
		}

		const phone = (data.phone ?? '').trim();
		if (phone && !PHONE_RE.test(phone)) {
			invalid(issue.phone('Aquest número no acaba de quadrar 🤔'));
		}

		await getDb()
			.prepare(
				`INSERT INTO form_responses (name, availability, availability_raw, email, phone, consent, ts)
				 VALUES (?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				data.nom,
				data.availability,
				data.availability === 'custom' ? availabilityRaw : null,
				data.email,
				phone || null,
				1,
				new Date().toISOString()
			)
			.run();

		redirect(303, '/gracies');
	}
);
