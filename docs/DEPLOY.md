# Deploy & go-live guide

Three repos. All infra is Cloudflare free tier (Workers, D1, Workers AI, Access)
plus the existing landing on GitHub Pages. Nothing here has been deployed by the
build — these are the owner steps.

## TL;DR order

1. Create the two D1 databases, paste their ids into both repos' `wrangler.jsonc`.
2. Deploy `whatsapp-bot` and `curs-sardanes` as Cloudflare **Workers**.
3. Push `landing` (already auto-deploys) — done.
4. Create the two Cloudflare **Access** apps (admin gates) + custom domains.
5. Meta/WhatsApp setup, then flip `WA_ENABLED=true` (last, owner-gated).

> **Both apps are Cloudflare _Workers_, not Pages.** `curs-sardanes` really is
> SvelteKit (output `.svelte-kit/cloudflare`); `whatsapp-bot` is a Hono Worker
> (entry `src/index.ts`, assets in `./public`) — it has **no**
> `.svelte-kit/cloudflare` dir. Setting the bot up as a **Pages** project fails
> with `Output directory ".svelte-kit/cloudflare" not found`. For each Worker's
> git build: build `npm run build`, deploy `npx wrangler deploy`, and leave the
> Pages-only "build output directory" field EMPTY. See `whatsapp-bot/README.md`.

---

## 0. Trial in production WITHOUT Meta / a phone number

Meta business verification takes days, and you don't want to buy a number before
you're sure. **You can run the whole thing in production now, for free, and
evaluate the real experience — no Meta app, no number.** What works without Meta:

- The **campaign site** end to end: pitch, `/go` click tracking, `/formulari`
  fallback form (writes to prod D1), `/gracies`, `/privacitat`, and the
  `/admin` report. Only the `wa.me` deep link has nowhere real to land yet.
- **Kudi** driven via the built-in **Simulador** (in the inbox at
  `wa.barrakudesbegur.org/admin`), which runs the *same* router code against the
  real production D1. Conversations, the survey, the inbox transcript, and the
  cross-database funnel in the campaign `/admin` all populate with real data.

Setup for the trial:

1. Do steps 1, 2, 4 below (D1s, deploy both Workers, Access apps + domains).
   **Skip** the Meta steps (5) — leave `WA_ENABLED="false"` (already the
   default; outbound sends are logged to D1, never sent).
2. Temporarily enable the simulator in production so you can drive Kudi from the
   inbox: in `whatsapp-bot`, set a **secret** `DEV_SIMULATOR=true`
   (`npx wrangler secret put DEV_SIMULATOR`), then redeploy.
   - ⚠️ `POST /dev/simulate` is **not** behind Access, so while this is on anyone
     who knows the URL could inject fake conversations. It's fine for a private
     trial; **turn it off before a public launch**
     (`npx wrangler secret delete DEV_SIMULATOR` + redeploy).
3. For `curs-sardanes`, `PUBLIC_WA_NUMBER` can stay the placeholder for now — the
   site works; the `wa.me` button just won't open a real chat until you have a
   number. (When you get the free Meta **test number**, drop it in and the button
   works for you + up to 5 allowlisted testers — see step 5.)

Then verify (this is task "Production verification without Meta"):

- Open `wa.barrakudesbegur.org/admin` → Simulador → drive a full survey
  (trigger → name → button → list). Confirm it appears under Converses with the
  transcript, and the reply-as-Kudi box + 24h window behave.
- Open `sardanes.barrakudesbegur.org/admin` → the funnel and people list show
  those simulated completions joined from `BOT_DB`, plus any real `/formulari`
  submissions and `/go` clicks. Export CSV.
- Submit `/formulari` on the live site and confirm the row + the person in the
  report.

When you're happy and Meta is verified, do step 5 and flip `WA_ENABLED=true`.

---

## 1. D1 databases (do this first)

```sh
# in whatsapp-bot/
npx wrangler d1 create whatsapp-bot     # copy the printed database_id
npx wrangler d1 migrations apply whatsapp-bot --remote

# in curs-sardanes/
npx wrangler d1 create curs-sardanes    # copy the printed database_id
npx wrangler d1 migrations apply curs-sardanes --remote
```

Then paste the ids (replace the `00000…`/`11111…` placeholders):

- `whatsapp-bot/wrangler.jsonc` → `DB.database_id` = the **whatsapp-bot** id.
- `curs-sardanes/wrangler.jsonc` → `DB.database_id` = the **curs-sardanes** id,
  and `BOT_DB.database_id` = the **whatsapp-bot** id (same id as above — this is
  how the admin funnel reads the bot's data).

## 2. Deploy the Workers

Both are Cloudflare **Workers** (NOT Pages — a Pages project fails on the
Worker-style `wrangler.jsonc`).

**Option A — git-connected (Workers Builds), recommended:** Cloudflare dashboard
→ Workers & Pages → Create → Workers → Import a repository.

| Repo | Build command | Deploy command |
| --- | --- | --- |
| `whatsapp-bot` | `npm run build` | `npx wrangler deploy` |
| `curs-sardanes` | `npm run build` | `npx wrangler deploy` |

For `curs-sardanes`, add the build var `PUBLIC_WA_NUMBER` (inlined at build time;
the prefill message is hardcoded in `src/lib/wa.ts`). `whatsapp-bot`'s
`npm run build` builds the admin SPA.

**Option B — manual:** `npm run build && npx wrangler deploy` from each repo on a
machine with `wrangler login`.

Verify without deploying anytime: `npx wrangler deploy --dry-run`.

## 3. landing-barrakudes

Already pushed (banner + news post + `events.json`). It auto-deploys via its
existing pipeline. Confirm `https://barrakudesbegur.org/events.json` responds —
the bot reads it for Kudi's live agenda (`EVENTS_JSON_URL`).

## 4. Custom domains + Cloudflare Access (admin gates)

Custom domains (Worker → Settings → Domains & Routes):

- `curs-sardanes` → `sardanes.barrakudesbegur.org`
- `whatsapp-bot` → `wa.barrakudesbegur.org` (keep `/webhook` public for Meta)

Two Access applications (Zero Trust → Access → Applications), self-hosted,
allowing emails `@barrakudesbegur.org`:

- App 1: `sardanes.barrakudesbegur.org/admin*`
- App 2: `wa.barrakudesbegur.org/admin*` (NOT `/webhook`)

For each, copy the **Application Audience (AUD)** tag and set it:

- `curs-sardanes` var `CF_ACCESS_AUD` (in `wrangler.jsonc`).
- `whatsapp-bot` var `CF_ACCESS_AUD`.

If you also want the preview deployments gated, add that app's AUD too,
comma-separated (the coin-reader trick). Team domain + email-domain vars are
already set. There is no `ADMIN_DEV`/`DEV_ACCESS_BYPASS` in production — the gate
fails closed without a valid Access JWT.

## 5. WhatsApp / Meta (owner-gated, last)

In `whatsapp-bot`, set the four secrets:

```sh
npx wrangler secret put WA_ACCESS_TOKEN
npx wrangler secret put WA_APP_SECRET
npx wrangler secret put WA_VERIFY_TOKEN
npx wrangler secret put WA_PHONE_NUMBER_ID
```

Meta App → WhatsApp → Configuration → Webhook:

- Callback URL: `https://wa.barrakudesbegur.org/webhook`
- Verify token: the same value as `WA_VERIFY_TOKEN`
- Subscribe to the `messages` field.

Then flip outbound sends on: set `WA_ENABLED="true"` in `whatsapp-bot/wrangler.jsonc`
and redeploy. Until then everything works end-to-end via the simulator with sends
logged to D1 (no real messages).

Finally: set the WhatsApp number in `curs-sardanes` (`PUBLIC_WA_NUMBER` build var
/ `.env`) so the wa.me links point at Kudi, and set Kudi's WABA profile (name
"Kudi", the nino photo).

## What the agent needs from you (blocking checklist)

- [ ] Run `wrangler d1 create` twice; paste the 2 ids into the 3 binding slots.
- [ ] Kudi's real WhatsApp number → `PUBLIC_WA_NUMBER`.
- [ ] Meta app + WABA: `WA_ACCESS_TOKEN`, `WA_APP_SECRET`, `WA_VERIFY_TOKEN`,
      `WA_PHONE_NUMBER_ID`.
- [ ] Create the 2 Access apps → paste each `CF_ACCESS_AUD`.
- [ ] Point the 2 custom domains.
- [ ] Subscribe the Meta webhook, then set `WA_ENABLED=true`.
- [ ] Replace the placeholder nino SVGs + OG PNG with the finals from Figma
      (optional polish).
- [ ] Review the Catalan copy (drafts are launch-ready but you polish).

## Local dev quick ref

```sh
# curs-sardanes
npm run db:setup:local   # migrate own DB + seed a fake BOT_DB for the funnel
npm run dev              # ADMIN_DEV=true bypasses the Access gate locally

# whatsapp-bot
npm run db:migrate:local
npm run dev              # builds the admin SPA, then wrangler dev; DEV_SIMULATOR on
```
