-- ---------------------------------------------------------------------
-- Phase 6: developer self-submission — the submissions table (0001_init)
-- has its own moderation `status` (pending/approved/rejected), but no
-- field for the ESTATE's own lifecycle status (Completed/Announced/...)
-- that estates.status requires on publish. The submitter picks this
-- directly, since they know their own project's real status.
-- ---------------------------------------------------------------------

ALTER TABLE submissions ADD COLUMN estate_status text NOT NULL DEFAULT 'Announced'
  CHECK (estate_status IN ('Completed', 'Announced', 'Planned', 'In Progress', 'Stalled'));
