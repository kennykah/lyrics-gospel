-- Patch: dynamic per-song edification content
-- Safe to run multiple times

ALTER TABLE songs
ADD COLUMN IF NOT EXISTS edification_content TEXT;
