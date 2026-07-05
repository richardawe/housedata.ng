-- ---------------------------------------------------------------------
-- Phase 4 follow-up: show approved verification photos publicly.
--
-- Denormalized onto estates (same pattern as verified/verified_at)
-- so api/estates.php can return them without a join. Populated by
-- api/admin/verification-review.php on approval, copied from the
-- verification_invites row that was reviewed.
-- ---------------------------------------------------------------------

ALTER TABLE estates ADD COLUMN verified_photo1_path text;
ALTER TABLE estates ADD COLUMN verified_photo2_path text;
ALTER TABLE estates ADD COLUMN verified_photo3_path text;
