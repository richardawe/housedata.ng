-- ---------------------------------------------------------------------
-- Phase 4: verification / trust program — self-service outreach intake.
--
-- An admin invites an estate's on-file contact to confirm details and
-- upload photos. Submitting does NOT verify the estate by itself: it
-- only flips the row to 'submitted' for admin review. Approval writes
-- the actual audit record into estate_verifications (see 0001_init.sql)
-- and denormalizes estates.verified/verified_at — this table is just
-- the invite/intake lifecycle, not the source of truth for "verified".
-- ---------------------------------------------------------------------

CREATE TABLE verification_invites (
  id              serial PRIMARY KEY,
  estate_id       text NOT NULL REFERENCES estates(id) ON DELETE CASCADE,
  token_hash      text NOT NULL UNIQUE,
  invited_by      integer NOT NULL REFERENCES users(id),
  contact_email   text NOT NULL,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
  contact_person  text,
  contact_phone   text,
  notes           text,
  image1_path     text,
  image2_path     text,
  image3_path     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL,
  submitted_at    timestamptz,
  reviewed_by     integer REFERENCES users(id),
  reviewed_at     timestamptz
);

CREATE INDEX verification_invites_estate_id_idx ON verification_invites (estate_id);
CREATE INDEX verification_invites_status_idx ON verification_invites (status);
