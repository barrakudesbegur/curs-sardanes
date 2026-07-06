-- curs-sardanes database schema.
-- Applied to local D1 with: npm run db:apply:local

-- Short tracked links (posters, IG, web...). `code` is what appears in /go?q=<code>.
CREATE TABLE links (
  code TEXT PRIMARY KEY,               -- 'p1', 'ig', 'bio', 'web', 'noticia', 'pm'...
  label TEXT NOT NULL,                 -- 'Cartell · Plaça de la Vila'
  created_at TEXT NOT NULL,
  archived INTEGER NOT NULL DEFAULT 0
);

-- One row per click on a tracked link (or a direct visit).
CREATE TABLE clicks (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL,                  -- FK-ish; unknown codes logged as 'unknown:<raw>'
  ts TEXT NOT NULL,
  platform TEXT,                       -- 'mobile' | 'desktop' (UA sniff, coarse)
  referer TEXT
);

CREATE INDEX idx_clicks_code ON clicks (code);
CREATE INDEX idx_clicks_ts ON clicks (ts);

-- Fallback web form submissions (for people without WhatsApp). The form's one
-- job is to capture a *contactable* interested person, hence email NOT NULL.
CREATE TABLE form_responses (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  availability TEXT NOT NULL,
  availability_raw TEXT,               -- free text when availability='custom'
  email TEXT NOT NULL,                 -- always required: it's how we notify them
  phone TEXT,                          -- optional WhatsApp number (they have WhatsApp but wa.me failed)
  consent INTEGER NOT NULL,            -- RGPD checkbox (see /privacitat)
  ts TEXT NOT NULL
);

-- Seed the canonical campaign links. Organizers can add
-- more from the admin later; INSERT OR IGNORE keeps this idempotent.
INSERT OR IGNORE INTO links (code, label, created_at, archived) VALUES
  ('p1',      'Cartell · Plaça de la Vila',        strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), 0),
  ('p2',      'Cartell · Local dels Barrakudes',   strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), 0),
  ('ig',      'Instagram · Publicació',            strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), 0),
  ('bio',     'Instagram · Bio',                   strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), 0),
  ('web',     'Web · barrakudesbegur.org',         strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), 0),
  ('noticia', 'Web · Notícia',                     strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), 0),
  ('pm',      'Missatge directe',                  strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), 0),
  ('direct',  'Visita directa a la web',           strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), 0);
