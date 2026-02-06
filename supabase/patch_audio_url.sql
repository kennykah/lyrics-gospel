-- Make audio_url optional if you do not store audio
ALTER TABLE songs ALTER COLUMN audio_url DROP NOT NULL;

-- Optional: set a default placeholder
ALTER TABLE songs ALTER COLUMN audio_url SET DEFAULT 'local://temp-audio';
