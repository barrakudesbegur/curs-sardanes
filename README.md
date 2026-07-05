# curs-sardanes

Campaign site for the Barrakudes de Begur **"Curs de sardanes"** demand-validation
campaign: it routes people from posters/Instagram into a WhatsApp conversation
with **Kudi** (see [`barrakudesbegur/whatsapp-bot`](https://github.com/barrakudesbegur/whatsapp-bot)),
logs click-level attribution, and offers a fallback form for people without
WhatsApp. Full spec in [`docs/PLAN.md`](docs/PLAN.md).

**Stack:** SvelteKit 2 + Svelte 5 (remote functions) · Cloudflare **Workers**
(not Pages) via `@sveltejs/adapter-cloudflare` · Tailwind 4 · D1.

## Routes

| Route          | Purpose                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/`            | Pitch page, big CTA to WhatsApp. Logs a `direct` click.                                                                             |
| `/go?q=<code>` | Tracked interstitial (posters/IG/QR target): logs the click, hands off to wa.me, morphs into a fallback UI if WhatsApp never opens. |
| `/formulari`   | Fallback form (no WhatsApp): name, availability, email (required), optional WhatsApp number, RGPD consent.                          |
| `/gracies`     | Post-submit celebration.                                                                                                            |
| `/privacitat`  | Privacy policy (form + bot + click logging).                                                                                        |
| `/admin`       | Campaign report (Cloudflare Access-gated).                                                                                          |

## Local development

```sh
npm install
npm run db:apply:local   # create/migrate the local D1 (.wrangler/state)
npm run dev
```

- `.env` (gitignored) holds `PUBLIC_WA_NUMBER` / `PUBLIC_WA_PREFILL` — see `.env.example`.
- `npm run validate` — prettier + eslint + svelte-check.
- `npm run test:unit` / `npm run test:e2e` / `npm test` — vitest + Playwright
  (e2e boots the dev server and asserts against the local D1).

## Deploy (Cloudflare **Workers**, not Pages)

This repo is a **Worker**: `wrangler.jsonc` sets `main`/`assets` to
`.svelte-kit/cloudflare`, which `npm run build` produces. A Cloudflare **Pages**
project will NOT work with this config (Pages ignores a Worker-style
`wrangler.jsonc` — its builder logs "No Wrangler configuration file found").

**Git-connected deploys (Workers Builds):** Cloudflare dashboard →
_Workers & Pages → Create → Workers → Import a repository_ →
`barrakudesbegur/curs-sardanes`:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- No "build output directory" setting is needed — `wrangler.jsonc` already
  points at `.svelte-kit/cloudflare`.
- Build variables: `PUBLIC_WA_NUMBER`, `PUBLIC_WA_PREFILL` (they are inlined at
  build time by `$env/static/public`).

**One-time setup before the first deploy succeeds:**

1. `npx wrangler d1 create curs-sardanes` → paste the printed id into the `DB`
   entry in `wrangler.jsonc`.
2. `npx wrangler d1 create whatsapp-bot` (if the bot repo hasn't already) →
   paste its id into the `BOT_DB` entry.
3. `npm run db:apply:remote` — run the migrations against the real database.
4. Custom domain `sardanes.barrakudesbegur.org` on the Worker, and a Cloudflare
   Access application covering `/admin*` (same pattern as coin-reader,
   including the preview-deployment AUD trick).

Manual deploy from a machine with `wrangler login`: `npm run build && npx wrangler deploy`.
