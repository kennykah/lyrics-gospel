-- Re-enable authenticated inserts (disable public beta policies)

-- songs
DROP POLICY IF EXISTS "songs_insert_public" ON songs;
CREATE POLICY "songs_insert_authenticated" ON songs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- lrc_files
DROP POLICY IF EXISTS "lrc_insert_public" ON lrc_files;
CREATE POLICY "lrc_insert_authenticated" ON lrc_files FOR INSERT WITH CHECK (auth.role() = 'authenticated');
