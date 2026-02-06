-- Ensure submitted_by exists (for schemas based on lyricsync-remote)
ALTER TABLE songs ADD COLUMN IF NOT EXISTS submitted_by UUID;
