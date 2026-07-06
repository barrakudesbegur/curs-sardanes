# Pla d'implementació — Campanya "Curs de sardanes" + bot de WhatsApp

> **Status:** approved plan, ready to implement. Decided 2026-07-05 after a full grilling session with the owner.
> **Audience:** an implementing agent (or human) with access to `/Users/maui/Projects`.
> **Scope:** three repos — `curs-sardanes` (this one, new SvelteKit app), `whatsapp-bot` (new repo, to be created), `landing-barrakudes` (small edit).
> **Amended 2026-07-05:** tracked short links live at `/go?q=<code>` (dedicated path + query param), not the originally drafted path-based `/[code]`.
> **Amended 2026-07-05 (2):** the fallback form drops the chat-style "què fem quan se sàpiga?" question — a web fallback must always yield a *contactable* person, so email is required for everyone; the consent links to a real privacy policy at `/privacitat` (adapted from `signature-collection`), covering the form, the WhatsApp bot and click logging.
> **Amended 2026-07-05 (3):** the fallback form also captures an **optional WhatsApp number** — people whose wa.me redirect failed still have WhatsApp; the number enables the future group invite / phase-2 template notification.
> **Amended 2026-07-06:** this repo no longer stores any WhatsApp number (the `WA_NUMBER` var is gone). Chat links point at `wa.barrakudesbegur.org` — the whatsapp-bot's index, which accepts the same query params as wa.me (`?text=`) and 302-forwards to the real wa.me link, resolving the number from Meta on the bot's side.

---

## 1. Goal & context

Barrakudes Begur (youth association, barrakudesbegur.org) wants to validate demand for a **sardanes dance course**: several months long, sessions on **weekends** (Begur youth leave town on workdays). It is only an idea — the campaign measures interest before committing.

Funnel: **posters/flyers with QR around town + Instagram** → short tracked links → **WhatsApp conversation with "Kudi"**, a scripted bot with AI fallback (Kudi is the nino character from the Barrakudes logo). A hidden web form is the fallback for people without WhatsApp. Organizers monitor everything from mobile-friendly admin pages.

**Key decisions already made (do not re-litigate):**

- WhatsApp-first UX. The website's job is to route people into WhatsApp, not to host the survey.
- Real bot from day one on **Meta WhatsApp Cloud API** (no Meta Business App emulation, no unofficial libraries — ban risk; no third-party bot platforms — owner wants owned infra, zero freemium dependencies).
- Bot is **general-purpose** for the association (will host future flows: event RSVPs, announcements, FAQs). The course survey is just its first flow. Hence its own repo.
- Scripted state machine + **Workers AI** fallback for free text (not a full AI agent).
- Attribution is **click-level only**: short links log the click, the prefilled WhatsApp message stays clean (no ref codes). Verified: wa.me links produce **no** webhook referral data (only paid Click-to-WhatsApp ads do — if ads are ever run, `referral.ctwa_clid` attribution comes free).
- Everything on Cloudflare free tier: Workers, D1, Workers AI, Cloudflare Access. **No VPS.**

**Blocked-on-owner (do NOT wait for these; build with the simulator, wire later):**

- Kudi's phone number (prepaid vs virtual — owner researching).
- Meta app + WABA creation, access tokens, business verification.
- Kudi profile assets (nino image from owner's Figma).
- Final review of all Catalan copy (drafts below are good to implement, owner polishes pre-launch).

---

## 2. The three repos

| Repo | What | Domain | Stack |
|---|---|---|---|
| `whatsapp-bot` (create; GitHub `barrakudesbegur/whatsapp-bot`) | Cloud API webhook, flow engine, Kudi persona, KB, inbox admin | `wa.barrakudesbegur.org` | CF Worker (TS + Hono), D1 `whatsapp-bot`, Workers AI, small Svelte inbox UI served as Worker assets |
| `curs-sardanes` (exists, ~empty) | Campaign site: interstitial redirect, pitch, fallback form, short links, campaign admin | `sardanes.barrakudesbegur.org` | SvelteKit 2 + Svelte 5, adapter-cloudflare (Workers), Tailwind 4, D1 `curs-sardanes` |
| `landing-barrakudes` (exists) | Dismissable home banner + news post linking to the campaign | barrakudesbegur.org | Astro 6 (existing) |

Cross-repo data: the campaign admin binds **both** D1 databases (`DB` own + `BOT_DB` read-only by convention). Each repo owns only its own migrations. Cloudflare allows binding any D1 by `database_id`.

---

## 3. Brand & tone (all repos)

- Titles: **Londrina Solid** (`@fontsource/londrina-solid`), body Inter. Primary **#ff8201** (`--color-brand`). Mirror `landing-barrakudes/src/styles/global.css` tokens.
- Copy: **informal Catalan** (tuteig, playful, emoji-friendly, never corporate). All user-facing text in Catalan; code/comments in English.
- **Ninos**: blob humanoids per `curs-sardanes/docs/ninos/prompt.md` — single continuous thick black outline (28px body / 24px detail at vector scale), two oval eyes, no mouth, stubby limbs, no fills, always mid-action (dancing sardanes here). Owner provides finals from Figma; meanwhile create placeholder SVGs strictly following that style guide.
- Kudi's voice: brief messages, warm, a bit cheeky, 1 emoji per message max ~2, always "tu". Kudi self-describes as "el nino taronja del logo dels Barrakudes".

---

## 4. Repo `whatsapp-bot`

### 4.1 Worker surface

```
GET  /webhook          Meta verification handshake (echo hub.challenge if hub.verify_token matches)
POST /webhook          inbound events. MUST validate X-Hub-Signature-256 (HMAC-SHA256 with WA_APP_SECRET) before parsing
GET  /admin/*          inbox SPA (static assets)  — behind Cloudflare Access
POST /admin/api/*      inbox/KB/settings API      — behind Cloudflare Access (JWT verified in-worker too)
POST /dev/simulate     dev-only fake inbound message (guarded: only when env.DEV_SIMULATOR === "true"; never set in prod)
```

Cloudflare Access application covers `wa.barrakudesbegur.org/admin*` only — `/webhook` must stay public for Meta. Port the JWT verification from `coin-reader/functions/_lib/access.ts` (team domain `https://barrakudesbegur.cloudflareaccess.com`, allowed emails `@barrakudesbegur.org`; same fail-closed behavior).

Secrets (wrangler secret): `WA_ACCESS_TOKEN`, `WA_APP_SECRET`, `WA_VERIFY_TOKEN`, `WA_PHONE_NUMBER_ID`. Vars: `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD`, `CF_ACCESS_EMAIL_DOMAIN`, `WA_ENABLED` ("false" until Meta setup exists → outbound sends become no-ops logged to D1, so the whole system is testable end-to-end via simulator + inbox).

Check current Cloud API Graph version and payload shapes via context7 / the installed `whatsapp-automation` skill at implementation time — do not trust memory for API details.

### 4.2 D1 schema (`whatsapp-bot` database)

```sql
CREATE TABLE people (
  id INTEGER PRIMARY KEY,
  wa_id TEXT NOT NULL UNIQUE,          -- phone in Meta format
  profile_name TEXT,                    -- from webhook contacts[].profile.name
  display_name TEXT,                    -- "com vols que et digui?"
  created_at TEXT NOT NULL,
  last_inbound_at TEXT,                 -- drives 24h-window checks in inbox
  gdpr_deleted INTEGER DEFAULT 0
);

CREATE TABLE flow_instances (
  id INTEGER PRIMARY KEY,
  person_id INTEGER NOT NULL REFERENCES people(id),
  flow_type TEXT NOT NULL,              -- 'curs-sardanes', future: 'esdeveniment-x'...
  status TEXT NOT NULL,                 -- 'active' | 'completed' | 'abandoned' | 'declined'
  step TEXT,                            -- current step key while active
  data_json TEXT NOT NULL DEFAULT '{}', -- collected answers (queryable via json_extract)
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY,
  wa_message_id TEXT UNIQUE,            -- UNIQUE = webhook retry dedupe (ignore conflicts)
  person_id INTEGER NOT NULL REFERENCES people(id),
  direction TEXT NOT NULL,              -- 'in' | 'out'
  msg_type TEXT NOT NULL,               -- text | interactive | list_reply | button_reply | unsupported...
  body_json TEXT NOT NULL,              -- full payload for transcript rendering
  flow_instance_id INTEGER,             -- attribution via context.id when applicable
  ai_meta_json TEXT,                    -- model, latency, tokens when AI fallback produced it
  created_at TEXT NOT NULL
);

CREATE TABLE kb_entries (               -- DYNAMIC knowledge (editable in inbox admin)
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content_md TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE settings (                 -- key/value; seed: course_status='exploring', course_status_note=''
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### 4.3 Message router (per inbound webhook)

1. Verify signature → extract message → `INSERT OR IGNORE` by `wa_message_id` (retry dedupe; if ignored, stop).
2. Upsert person (update `profile_name`, `last_inbound_at`).
3. Route, in order:
   - **Interactive reply** (button/list): `context.id` → look up the outbound message → its `flow_instance_id` → dispatch to that flow's step handler. This is what makes concurrent flows per person safe.
   - **Trigger text** matches a flow trigger (normalized fuzzy match; `curs-sardanes` trigger: "explica'm això del curs de sardanes") → start that flow (or resume/offer-update if one exists, see 4.5 edge cases).
   - **Active flow exists** → treat text as answer attempt for current step; if it doesn't parse → **AI fallback** (answer with KB in Kudi's voice, then re-ask the pending question).
   - **No active flow** → AI fallback with KB (general Q&A: "què és Barrakudes?", "hi ha novetats del curs?"...). If the person never did the survey, the fallback's system prompt tells Kudi to gently offer it.
4. State updates use optimistic concurrency: `UPDATE flow_instances SET step=?, ... WHERE id=? AND step=?` — if 0 rows changed, another invocation won; re-read and skip sending.

### 4.4 The `curs-sardanes` flow (draft copy — owner reviews before launch)

Flows are code modules registered in a `flows/` registry: `{ trigger, start(ctx), onStep(ctx, step, input) }`, pure logic returning actions (messages to send + state changes) so they're unit-testable without WhatsApp.

**User speaks first** (verified: businesses cannot initiate without a paid template — the wa.me prefilled message is the trigger):

```
U  (prefilled): Explica'm això del curs de sardanes 💃

K1 intro+name:  Ei! 👋 Sóc en Kudi — el nino taronja del logo dels
                Barrakudes (sí, tinc nom!). Ara t'explico això del curs,
                però primer de tot: com vols que et digui?
U:  <free text> → save people.display_name        [AI fallback if unclear]

K2 info:        Genial, {nom}! 🧡 Doncs mira: als Barrakudes ens ronda
                pel cap muntar un curs per aprendre a ballar sardanes.
                De moment és només una idea — abans de llançar-nos-hi
                volem saber si hi ha prou gent que s'hi apuntaria.
                Seria un curs de debò: unes quantes sessions repartides
                durant uns mesos, els caps de setmana (que és quan
                tothom és a Begur 😉). Si tira endavant, muntarem un
                grup de WhatsApp per organitzar-ho. I potser et torno a
                escriure per demanar-te algun detall o opinió.

K3 action (buttons, all ≤20 chars):
                Què vols que faci quan sapiguem si es fa?
                [Afegeix-me al grup] [Només avisa'm] [Res, gràcies]
   → 'Res, gràcies': record status='declined' →
                Cap problema! 😊 Si canvies d'idea, escriu-me i seguim
                on ho hem deixat. I si tens preguntes dels Barrakudes,
                dispara!
                (flow ends; person can restart anytime)

K4 availability (list message, row titles ≤24 chars) — only if grup/avisa'm:
                Última pregunteta i et deixo en pau 😄 Quan et sol anar bé?
                rows: Dissabtes · Diumenges · Entre setmana ·
                      Depèn del cap de setmana · M'és igual, tot em va bé
                body/footer copy invites free text: "Si cap opció t'encaixa,
                escriu-m'ho amb les teves paraules i ho apunto!"
                [free text → AI interprets → store raw + normalized]

K5 close:       Doncs ja està, {nom}! 🎉
                {grup:    Quan el curs sigui una realitat, t'envio la
                          invitació al grup per aquí.}
                {avisa'm: Quan sapiguem si es fa, t'escric per aquí.}
                Mentrestant, si tens cap pregunta — del curs, dels
                Barrakudes, del que sigui — pregunta-me-la! 🧡
```

`data_json` ends as: `{ "action": "grup"|"avisam"|"res", "availability": "dissabtes"|"diumenges"|"entre-setmana"|"depen"|"igual"|"custom", "availability_raw": "<text if custom>" }`.

WhatsApp constraints to respect (verify current values in docs): max **3 buttons**, button titles ≤ **20 chars**; list rows ≤ **10**, row titles ≤ **24 chars**; free-form replies allowed only within the **24h customer service window** (all survey messages are replies inside it → **free**, confirmed on Meta's pricing page).

### 4.5 Edge cases (implement all)

- **Returning completed person** re-triggers flow → "Ja et tenia apuntat! 😄 Vols canviar alguna resposta?" [Sí / No] → restart or friendly ack.
- **Media/audio/sticker** → "Ho sento, només sé llegir text 😅" + re-ask pending question if any.
- **Duplicate/out-of-order webhooks** → covered by `wa_message_id` unique + optimistic step update.
- **GDPR erase**: intent "esborra les meves dades" (scripted regex + AI intent) → confirm → anonymize person row (`gdpr_deleted=1`, null name/phone hash) + delete messages. Also a delete button in inbox.
- **Status webhooks** (sent/delivered/read) → update outbound message rows; ignore errors gracefully but log Meta error payloads.
- **Unknown person messages out of nowhere** (typed the number manually) → AI fallback with KB; offer the survey.

### 4.6 Kudi's knowledge base (new requirement)

Two layers, both concatenated into the AI fallback prompt (total is tiny — no vector search, plain context stuffing):

1. **Static, versioned in repo** (`kb/*.md`, imported as text at build): `que-es-barrakudes.md` (what the association is, what it does), `kudi.md` (who Kudi is — the logo nino), `xarxes.md` (Instagram handle, website — extract real values from `landing-barrakudes/src/consts.ts`), `curs-sardanes-faq.md` (it's an idea; weekends; several months; free?/price → "encara no ho sabem"; who can join).
2. **Dynamic, in D1 `kb_entries`, editable from the inbox admin** — announcements, upcoming/past events, and anything organizers want Kudi to know without a deploy.
3. **Live agenda from the landing (no duplication; added 2026-07-05)**: `landing-barrakudes` exposes its `events` content collection at `https://barrakudesbegur.org/events.json` (static endpoint built with the site); the bot fetches it at answer time (edge-cached ~15 min, fail-soft: section dropped on error) and injects upcoming/past events into the prompt. Var `EVENTS_JSON_URL` (unset/"off" disables).
4. **`settings.course_status`** (+ note) is injected explicitly so "hi ha novetats del curs?" always gets the current truth (exploring / confirmed / cancelled + note).

AI fallback prompt shape: Kudi persona & voice rules + KB + course status + conversation snippet + pending step (if any) + instructions: answer briefly in informal Catalan, never invent facts not in KB ("no ho sé, però pregunta-ho a l'Instagram @…"), then steer back to the pending question. Structured-output mode when interpreting an answer for a step.

**Model:** start `@cf/google/gemma-3-12b-it` (140+ languages, best free Catalan bet); fallback candidates `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, `@cf/mistralai/mistral-small-3.1-24b-instruct`. Wrap behind a one-file provider interface; log model+latency into `messages.ai_meta_json`. Ship `scripts/eval-catalan.ts` with ~15 sample utterances (off-script answers, FAQs, gibberish) to compare models manually. Free tier: 10k neurons/day — plenty.

### 4.7 Inbox admin (small Svelte SPA at `/admin`)

Mobile-first, brand-styled but utilitarian:

- **Converses**: list (name, last message, flow status badge), transcript view (WhatsApp-like bubbles), reply-as-Kudi box — disabled with explanation when `last_inbound_at` > 24h ago (window closed; template messaging is phase 2).
- **Coneixement**: CRUD for `kb_entries`; edit `course_status` + note.
- **Simulador** (dev builds only): fake-conversation playground hitting `/dev/simulate` so flows are testable without Meta.
- CSV export of completed `curs-sardanes` instances.

### 4.8 Testing

- Vitest: flow engine pure-function tests (every step, every branch, edge cases above), router dispatch tests with recorded webhook fixtures, signature validation test vectors.
- `wrangler dev` + simulator for manual runs. Cloudflare vitest-pool-workers for D1 integration tests if friction is low.

---

## 5. Repo `curs-sardanes` (SvelteKit site)

### 5.1 Stack & config

- SvelteKit 2 + Svelte 5 (runes). **Enable experimental features**: `kit.experimental.remoteFunctions: true` (+ `compilerOptions.experimental.async: true` for await-in-components). Use remote functions (`query`/`form`/`command` in `.remote.ts` files) for click logging and the fallback form.
- `@sveltejs/adapter-cloudflare` → Workers (not Pages). D1 binding `DB` (own) + `BOT_DB` (whatsapp-bot's DB, for the admin report). Custom domain `sardanes.barrakudesbegur.org`.
- Tailwind 4 (`@tailwindcss/vite`), `@fontsource/londrina-solid` + Inter. Define brand tokens matching the landing.
- **Author every `.svelte`/`.svelte.ts` file through the svelte MCP tooling / `svelte:svelte-file-editor` agent (autofixer pass mandatory), per repo owner's global rules. Use context7 for SvelteKit/Cloudflare docs.**
- Config: none — the WhatsApp target is the constant `wa.barrakudesbegur.org` (the bot's wa.me stand-in; accepts the same `?text=` param and resolves the number from Meta on its side — see the 2026-07-06 amendment; originally a `WA_NUMBER` runtime var). The prefill message is hardcoded in `src/lib/wa.ts` (`WA_PREFILL` = "Explica'm això del curs de sardanes 💃") since it must match the bot's flow trigger. One shared helper builds the chat URL.

### 5.2 D1 schema (`curs-sardanes` database)

```sql
CREATE TABLE links (
  code TEXT PRIMARY KEY,               -- 'p1', 'ig', 'bio', 'web', 'noticia', 'pm'...
  label TEXT NOT NULL,                 -- 'Cartell · Plaça de la Vila'
  created_at TEXT NOT NULL,
  archived INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE clicks (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL,                  -- FK-ish; unknown codes logged as 'unknown:<raw>'
  ts TEXT NOT NULL,
  platform TEXT,                       -- 'mobile' | 'desktop' (UA sniff, coarse)
  referer TEXT
);
CREATE TABLE form_responses (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  availability TEXT NOT NULL,
  availability_raw TEXT,               -- free text when availability='custom'
  email TEXT NOT NULL,                 -- always required: the fallback's job is a contactable person
  phone TEXT,                          -- optional WhatsApp number (they have WhatsApp but wa.me failed)
  consent INTEGER NOT NULL,            -- RGPD checkbox (see /privacitat)
  ts TEXT NOT NULL
);
```

### 5.3 Routes

- **`/` (pitch)**: Londrina hero ("Aprenem a ballar sardanes?"), dancing ninos, informal pitch (idea being explored, weekends, months, WhatsApp group), big CTA **"Parla amb en Kudi 💬"** → wa.me. Small, de-emphasized "No tens WhatsApp?" → `/formulari`. Direct visits log as code `direct`.
- **`/go?q=<code>` (interstitial — the poster/IG target)**: server `load` logs the click (code from the `q` query param, platform, referer; unknown codes still work, missing/empty `q` logs as `unknown:`). Mobile render: minimal "Un moment, t'envio amb en Kudi… 💃" + nino, then immediately `location.href = wa.me…`; a `visibilitychange`/`pagehide` heuristic (~2s) detects non-departure → morph into: "Vaja! No s'ha obert WhatsApp 🤔" `[Torna-ho a provar]` `[Omple el formulari]` + pitch content below. Desktop render: pitch + **QR of the wa.me link** + `[Obre WhatsApp Web]` + form link.- **`/formulari` (fallback form)**: header copy states WhatsApp is the preferred channel (+retry button). Fields: nom · disponibilitat (same 5 options + free text) · email (**always required** — the fallback exists to capture a *contactable* interested person; helper copy explains it's only used to notify about the course) · WhatsApp number (**optional** — for people who do have WhatsApp but the wa.me redirect failed; enables the group invite / phase-2 template notify) · RGPD consent checkbox linking to `/privacitat`. Submit via remote `form` function → `/gracies` (nino celebration).
- **`/privacitat`**: plain-Catalan privacy policy (adapted from `signature-collection`'s in-page policy) covering the web form, the WhatsApp bot (incl. AI processing) and click logging (no cookies, no IPs stored); data retention and rights (email `hola@barrakudesbegur.org` or tell Kudi "esborra les meves dades"). Linked from the form consent and a small site-wide footer (privacy + open-source links).
- **`/admin` (Cloudflare Access-gated via `hooks.server.ts`, port of coin-reader's `access.ts`)**: mobile-first report:
  - Clicks by source over time; totals per link.
  - **Funnel**: clicks → conversations started → surveys completed → grup/avisa'm (via `BOT_DB` `flow_instances` where `flow_type='curs-sardanes'`, `json_extract` for answers) + web form counts.
  - People list (display_name, source `whatsapp`/`web`, action, availability) + CSV export.
  - **`/admin/links`**: CRUD (code, label, archive) + per-link **QR download** (client-side SVG/PNG generation) for posters.
  - Link out to `wa.barrakudesbegur.org/admin` (inbox).
- `robots.txt` (disallow `/admin`), OG image with ninos, `lang="ca"`, favicon = nino.

### 5.4 Testing

- Playwright e2e: interstitial logs click + heuristic fallback (stub the redirect), form validation + submit, admin gated (dev bypass flag) and renders report with seeded data. Vitest for helpers. `npm run validate` mirroring coin-reader (format/lint/check).

---

## 6. Repo `landing-barrakudes` (Astro — minimal touch)

1. **Dismissable banner** on home (localStorage key, e.g. `sardanes-2026-dismissed`): "💃 Muntem un curs de sardanes? Digues-hi la teva →" → `https://sardanes.barrakudesbegur.org/go?q=web`. Brand orange, Londrina, matches existing components.
2. **News post** in the existing content collection announcing the idea, CTA → `…/go?q=noticia`.

Follow the repo's existing conventions (Astro 6, Tailwind 4, content collections). Nothing else changes.

---

## 7. Implementation order & acceptance

Suggested phases (each independently verifiable; PR-per-phase against the respective repo):

1. **curs-sardanes scaffold**: SvelteKit app, brand tokens, D1 + migrations, `/`, `/go` interstitial with heuristic, `/formulari`, `/gracies`. ✔ Local: click logged in local D1; form row written; heuristic fallback renders when redirect stubbed.
2. **curs-sardanes admin**: Access gate port, report (clicks+forms first), links CRUD + QR. ✔ Access fail-closed without config; report renders seeded data on a phone-sized viewport.
3. **whatsapp-bot core**: repo init, Worker + Hono, D1 + migrations, signature verification, router, `curs-sardanes` flow complete with all edge cases, `WA_ENABLED=false` no-op sender, simulator endpoint. ✔ Vitest green; full survey completable via simulator; replay of duplicate webhook fixtures causes no double-sends.
4. **whatsapp-bot AI + KB**: provider interface, Gemma 3 first, static `kb/` + `kb_entries` + `course_status` injection, eval script. ✔ Eval script outputs comparisons; off-script survey answers get interpreted; KB questions answered without hallucination.
5. **whatsapp-bot inbox**: conversations, transcripts, reply-as-Kudi with 24h-window guard, KB/settings editors, dev playground. ✔ Usable on a phone; window guard visibly blocks stale replies.
6. **Integration**: `BOT_DB` binding in curs-sardanes admin funnel; links seeded (`p1`, `p2`, `ig`, `bio`, `web`, `noticia`, `pm`, `direct`). ✔ Funnel numbers join across both DBs.
7. **landing-barrakudes**: banner + news post. ✔ Builds; banner dismisses persistently.
8. **Go-live (owner-gated)**: wire real webhook URL + secrets, `WA_ENABLED=true`, Meta app subscribed, test from a fresh phone via every link type, print-test one QR, set Kudi's profile (name "Kudi", nino photo) in WABA.

**Deploy**: Workers Builds (git push → deploy) or `wrangler deploy`; owner creates the two Cloudflare Access apps in dashboard (pattern known from coin-reader — remember the extra preview-deployment AUD trick documented in `coin-reader/wrangler.toml`).

## 8. Facts verified during planning (trust these, re-verify only if Meta docs changed)

- wa.me links: user always sends the first message; prefilled text via `?text=`; **no referral metadata** reaches the webhook (only paid CTWA ads carry `referral`/`ctwa_clid`).
- Service messages (replies within the 24h window) are **free** per Meta's official pricing page (a third-party blog claims charging starts 2026-10-01 — Meta docs do not; re-check pricing page in September 2026 before launch).
- Unverified WABA: cap of 250 *business-initiated* conversations/day and no approved display name — irrelevant for our user-initiated funnel; business verification is a later nice-to-have (until then some surfaces show the phone number instead of "Kudi").
- Cloud API **cannot create/manage groups**: "afegeix-me al grup" later means sending an invite link; the future "course confirmed" announcement to opted-in people is a **paid utility/marketing template** (~cents/person, Spain rates rose 2026-07-01) — that broadcast feature is explicitly **phase 2**, not this plan.
- Interactive limits: 3 buttons/20 chars; 10 list rows/24 chars.
- WhatsApp Flows (native in-chat forms) exist and are free in-session — deliberately **not used** for this survey (conversation has more personality); noted as the tool for future structured flows (event RSVPs etc.).
- Workers AI free tier: 10k neurons/day; Gemma 3 12B is the strongest multilingual free option hosted (no Catalan-specific model available).

## 9. Skills/MCP the implementing agent should use

- `svelte:svelte-file-editor` agent + svelte MCP (`svelte-autofixer`, docs) for every Svelte file — mandatory per owner's setup.
- `context7` for all library/API docs (owner's global rule), incl. Cloud API payloads and SvelteKit experimental flags.
- `whatsapp-automation` skill (installed) as Cloud API reference.
- `cloudflare`, `wrangler`, `workers-best-practices` skills for Worker/D1/bindings work; `playwright` MCP for e2e (owner's global rule).
- Frontend quality: `design-taste-frontend` / `web-design-guidelines` review pass on the public pages.
