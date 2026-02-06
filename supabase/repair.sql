-- Repair script (safe) to align existing DB with Gospel Lyrics app

-- songs columns
ALTER TABLE songs ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS lyrics_text TEXT;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS submitted_by UUID;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS created_by UUID;

-- defaults for safety
ALTER TABLE songs ALTER COLUMN lyrics_text SET DEFAULT '';
ALTER TABLE songs ALTER COLUMN audio_url SET DEFAULT 'local://temp-audio';

-- lrc_files columns
ALTER TABLE lrc_files ADD COLUMN IF NOT EXISTS created_by UUID;

-- restore strict insert policies (prod)
DROP POLICY IF EXISTS "songs_insert_public" ON songs;
DROP POLICY IF EXISTS "lrc_insert_public" ON lrc_files;

CREATE POLICY "songs_insert_authenticated" ON songs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "lrc_insert_authenticated" ON lrc_files FOR INSERT WITH CHECK (auth.role() = 'authenticated');
