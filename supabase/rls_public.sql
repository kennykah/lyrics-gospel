-- Gospel Lyrics - RLS policies (public insert for beta/testing)
-- WARNING: allows anonymous inserts. Use only for beta/testing.

-- songs
DROP POLICY IF EXISTS "songs_insert_authenticated" ON songs;
CREATE POLICY "songs_insert_public"
ON songs FOR INSERT WITH CHECK (true);

-- lrc_files
DROP POLICY IF EXISTS "lrc_insert_authenticated" ON lrc_files;
CREATE POLICY "lrc_insert_public"
ON lrc_files FOR INSERT WITH CHECK (true);
