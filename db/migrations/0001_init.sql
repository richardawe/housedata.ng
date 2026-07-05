-- housedata.ng — initial schema
--
-- Run once, manually, against the Postgres database created via cPanel's
-- "PostgreSQL Databases" tool:
--
--   psql "host=localhost port=5432 dbname=<yourdb> user=<youruser>" -f db/migrations/0001_init.sql
--
-- Covers every phase of the backend roadmap (estates, verification,
-- accounts, submissions, financier leads) in one pass so this is the only
-- manual SQL step ever required — later phases just start using tables
-- that already exist.

-- ---------------------------------------------------------------------
-- Phase 2: estates + agencies (read-only public API)
-- ---------------------------------------------------------------------

CREATE TABLE agencies (
  key         text PRIMARY KEY,
  name        text NOT NULL,
  phone       text,
  email       text,
  website     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE estates (
  id                  text PRIMARY KEY,
  name                text NOT NULL,
  state               text NOT NULL,
  lga                 text NOT NULL,
  area                text NOT NULL,
  type                text NOT NULL CHECK (type IN ('Government', 'Private')),
  status              text NOT NULL CHECK (status IN ('Completed', 'Announced', 'Planned', 'In Progress', 'Stalled')),
  lat                 double precision NOT NULL,
  lng                 double precision NOT NULL,
  unit_types          text,
  units_text          text,
  price_range         text,
  agency_key          text REFERENCES agencies(key),
  contact_name        text,
  contact_phone       text,
  contact_email       text,
  contact_website     text,
  agency_display_name text,
  source_note         text,
  source              text NOT NULL DEFAULT 'seed' CHECK (source IN ('seed', 'developer_submission', 'admin')),
  verified            boolean NOT NULL DEFAULT false,
  verified_at         timestamptz,
  is_active           boolean NOT NULL DEFAULT true,
  search_vector       tsvector,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX estates_state_idx ON estates (state);
CREATE INDEX estates_lga_idx ON estates (lga);
CREATE INDEX estates_type_idx ON estates (type);
CREATE INDEX estates_status_idx ON estates (status);
CREATE INDEX estates_agency_key_idx ON estates (agency_key);
CREATE INDEX estates_search_vector_idx ON estates USING GIN (search_vector);
CREATE INDEX estates_is_active_idx ON estates (is_active);

-- Postgres's default text search parser treats slash/hyphen-joined words
-- (e.g. "Lagos/Ibadan Expressway", common in this dataset's area names) as
-- a single compound token, not two separate lexemes — so a plain
-- to_tsvector() would make "Lagos" ungrep-able inside that phrase. Replace
-- those separators with spaces first so each place name tokenizes on its
-- own.
CREATE OR REPLACE FUNCTION housedata_normalize_for_search(input text) RETURNS text AS $$
  SELECT regexp_replace(coalesce(input, ''), '[/\-–—]', ' ', 'g');
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION estates_refresh_search_vector() RETURNS trigger AS $$
BEGIN
  IF NEW.agency_key IS NOT NULL THEN
    SELECT name INTO NEW.agency_display_name FROM agencies WHERE key = NEW.agency_key;
  ELSIF NEW.agency_display_name IS NULL THEN
    NEW.agency_display_name := NEW.contact_name;
  END IF;

  NEW.search_vector := to_tsvector('english',
    housedata_normalize_for_search(NEW.name) || ' ' ||
    housedata_normalize_for_search(NEW.area) || ' ' ||
    housedata_normalize_for_search(NEW.lga) || ' ' ||
    housedata_normalize_for_search(NEW.state) || ' ' ||
    housedata_normalize_for_search(NEW.agency_display_name)
  );
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER estates_search_vector_trigger
  BEFORE INSERT OR UPDATE ON estates
  FOR EACH ROW EXECUTE FUNCTION estates_refresh_search_vector();

CREATE OR REPLACE FUNCTION agencies_set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agencies_set_updated_at_trigger
  BEFORE UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION agencies_set_updated_at();

-- Renaming an agency keeps every estate that references it in sync,
-- without the application needing to fan out updates itself. This must be
-- an AFTER trigger: estates' own BEFORE trigger re-reads agencies.name to
-- build search_vector, and a BEFORE trigger here would still see the
-- pre-update row (uncommitted), stamping estates with the stale name.
CREATE OR REPLACE FUNCTION agencies_propagate_name_change() RETURNS trigger AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE estates SET agency_display_name = NEW.name WHERE agency_key = NEW.key;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agencies_propagate_name_change_trigger
  AFTER UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION agencies_propagate_name_change();

-- ---------------------------------------------------------------------
-- Phase 3: accounts (magic-link auth + sessions)
-- ---------------------------------------------------------------------

CREATE TABLE users (
  id             serial PRIMARY KEY,
  email          text NOT NULL,
  is_admin       boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  last_login_at  timestamptz
);
CREATE UNIQUE INDEX users_lower_email_idx ON users (lower(email));

CREATE TABLE magic_link_tokens (
  id                 serial PRIMARY KEY,
  user_id            integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash         text NOT NULL UNIQUE,
  purpose            text NOT NULL DEFAULT 'login',
  redirect_to        text,
  expires_at         timestamptz NOT NULL,
  used_at            timestamptz,
  requested_ip_hash  text,
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX magic_link_tokens_expires_at_idx ON magic_link_tokens (expires_at);
CREATE INDEX magic_link_tokens_user_id_idx ON magic_link_tokens (user_id);

CREATE TABLE sessions (
  session_token_hash  text PRIMARY KEY,
  user_id             integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at          timestamptz NOT NULL DEFAULT now(),
  expires_at          timestamptz NOT NULL,
  last_seen_at        timestamptz NOT NULL DEFAULT now(),
  revoked_at          timestamptz
);
CREATE INDEX sessions_user_id_idx ON sessions (user_id);
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);

-- ---------------------------------------------------------------------
-- Phase 4: data verification / trust program
-- ---------------------------------------------------------------------

CREATE TABLE estate_verifications (
  id              serial PRIMARY KEY,
  estate_id       text NOT NULL REFERENCES estates(id) ON DELETE CASCADE,
  verified_by     integer NOT NULL REFERENCES users(id),
  verified_at     timestamptz NOT NULL DEFAULT now(),
  method          text NOT NULL CHECK (method IN ('phone_call', 'email_confirmation', 'site_visit', 'agency_portal', 'document_review', 'other')),
  contact_person  text,
  notes           text,
  expires_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX estate_verifications_estate_id_idx ON estate_verifications (estate_id);

-- ---------------------------------------------------------------------
-- Phase 5: financier lead-capture
-- ---------------------------------------------------------------------

CREATE TABLE financiers (
  id             serial PRIMARY KEY,
  name           text NOT NULL,
  contact_email  text NOT NULL,
  contact_phone  text,
  is_active      boolean NOT NULL DEFAULT true,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE leads (
  id                       serial PRIMARY KEY,
  estate_id                text REFERENCES estates(id) ON DELETE SET NULL,
  estate_name_snapshot     text NOT NULL,
  financier_id             integer REFERENCES financiers(id) ON DELETE SET NULL,
  financier_name_snapshot  text NOT NULL,
  applicant_name           text NOT NULL,
  applicant_email          text NOT NULL,
  applicant_phone          text NOT NULL,
  loan_context             jsonb,
  status                   text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'sent', 'failed', 'contacted')),
  email_sent_at            timestamptz,
  email_error              text,
  ip_hash                  text,
  created_at               timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX leads_estate_id_idx ON leads (estate_id);
CREATE INDEX leads_financier_id_idx ON leads (financier_id);
CREATE INDEX leads_created_at_idx ON leads (created_at);
CREATE INDEX leads_status_idx ON leads (status);

-- ---------------------------------------------------------------------
-- Phase 6: developer self-submission + moderation queue
-- ---------------------------------------------------------------------

CREATE TABLE submissions (
  id                  serial PRIMARY KEY,
  name                text NOT NULL,
  state               text NOT NULL,
  lga                 text NOT NULL,
  area                text NOT NULL,
  type                text NOT NULL DEFAULT 'Private',
  lat                 double precision,
  lng                 double precision,
  unit_types          text,
  units_text          text,
  price_range         text,
  developer_org       text NOT NULL,
  submitter_name      text NOT NULL,
  submitter_email     text NOT NULL,
  submitter_phone     text,
  contact_name        text,
  contact_phone       text,
  contact_email       text,
  contact_website     text,
  source_note_draft   text,
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by         integer REFERENCES users(id),
  reviewed_at         timestamptz,
  review_notes        text,
  created_estate_id   text REFERENCES estates(id),
  submitter_ip_hash   text,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX submissions_status_idx ON submissions (status);
CREATE INDEX submissions_created_at_idx ON submissions (created_at);

-- ---------------------------------------------------------------------
-- Phase 7: bookmarks + saved-search alerts
-- ---------------------------------------------------------------------

CREATE TABLE bookmarks (
  id          serial PRIMARY KEY,
  user_id     integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  estate_id   text NOT NULL REFERENCES estates(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, estate_id)
);

CREATE TABLE saved_searches (
  id               serial PRIMARY KEY,
  user_id          integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name             text,
  filters          jsonb NOT NULL,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  last_checked_at  timestamptz
);

CREATE TABLE saved_search_matches (
  id                 serial PRIMARY KEY,
  saved_search_id    integer NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,
  estate_id          text NOT NULL REFERENCES estates(id) ON DELETE CASCADE,
  notified_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (saved_search_id, estate_id)
);

-- ---------------------------------------------------------------------
-- Shared: rate limiting for public forms (magic-link requests, leads,
-- estate submissions) — a fixed-window counter, no Redis needed.
-- ---------------------------------------------------------------------

CREATE TABLE rate_limits (
  id                 serial PRIMARY KEY,
  bucket             text NOT NULL,
  identifier_hash    text NOT NULL,
  window_start       timestamptz NOT NULL,
  count              integer NOT NULL DEFAULT 1,
  UNIQUE (bucket, identifier_hash, window_start)
);
