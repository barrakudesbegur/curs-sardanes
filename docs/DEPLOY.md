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

For `curs-sardanes`, add build vars `PUBLIC_WA_NUMBER` and `PUBLIC_WA_PREFILL`
(inlined at build time). `whatsapp-bot`'s `npm run build` builds the admin SPA.

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
