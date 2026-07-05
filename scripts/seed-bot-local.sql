-- LOCAL-ONLY seed for the BOT_DB binding (the whatsapp-bot database).
--
-- This repo does NOT own the whatsapp-bot schema — the real tables live in the
-- whatsapp-bot repo. But for local dev / e2e we create a minimal subset here and
-- insert a few fake people + completed surveys so the admin funnel and people
-- list have cross-database data to join. Run with:
--   npm run db:seed:bot:local
-- Never run against a real remote database.

CREATE TABLE IF NOT EXISTS people (
  id INTEGER PRIMARY KEY,
  wa_id TEXT NOT NULL UNIQUE,
  profile_name TEXT,
  display_name TEXT,
  created_at TEXT NOT NULL,
  last_inbound_at TEXT,
  gdpr_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS flow_instances (
  id INTEGER PRIMARY KEY,
  person_id INTEGER NOT NULL,
  flow_type TEXT NOT NULL,
  status TEXT NOT NULL,
  step TEXT,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);

DELETE FROM flow_instances;
DELETE FROM people;

INSERT INTO people (id, wa_id, profile_name, display_name, created_at, last_inbound_at, gdpr_deleted) VALUES
  (1, '34600111001', 'Laia', 'Laia', '2026-07-01T10:00:00Z', '2026-07-01T10:05:00Z', 0),
  (2, '34600111002', 'Pol', 'Pol',  '2026-07-02T11:00:00Z', '2026-07-02T11:07:00Z', 0),
  (3, '34600111003', 'Berta', 'Berta','2026-07-03T12:00:00Z', '2026-07-03T12:10:00Z', 0),
  (4, '34600111004', 'Nil', 'Nil',  '2026-07-04T09:00:00Z', '2026-07-04T09:03:00Z', 0);

INSERT INTO flow_instances (id, person_id, flow_type, status, step, data_json, created_at, updated_at, completed_at) VALUES
  (1, 1, 'curs-sardanes', 'completed', NULL, '{"action":"grup","availability":"dissabtes"}',   '2026-07-01T10:00:00Z', '2026-07-01T10:05:00Z', '2026-07-01T10:05:00Z'),
  (2, 2, 'curs-sardanes', 'completed', NULL, '{"action":"avisam","availability":"diumenges"}', '2026-07-02T11:00:00Z', '2026-07-02T11:07:00Z', '2026-07-02T11:07:00Z'),
  (3, 3, 'curs-sardanes', 'completed', NULL, '{"action":"grup","availability":"custom","availability_raw":"els divendres al vespre"}', '2026-07-03T12:00:00Z', '2026-07-03T12:10:00Z', '2026-07-03T12:10:00Z'),
  (4, 4, 'curs-sardanes', 'active', 'availability', '{"action":"avisam"}', '2026-07-04T09:00:00Z', '2026-07-04T09:03:00Z', NULL);
