-- Gospel Lyrics - RLS policies (minimal)

-- profiles
CREATE POLICY "profiles_select_all"
ON profiles FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE USING (auth.uid() = id);

-- songs
CREATE POLICY "songs_select_all"
ON songs FOR SELECT USING (true);

CREATE POLICY "songs_insert_authenticated"
ON songs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "songs_update_own"
ON songs FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = submitted_by);

-- lrc_files
CREATE POLICY "lrc_select_all"
ON lrc_files FOR SELECT USING (true);

CREATE POLICY "lrc_insert_authenticated"
ON lrc_files FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "lrc_update_own"
ON lrc_files FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM songs
    WHERE songs.id = lrc_files.song_id
    AND (songs.created_by = auth.uid() OR songs.submitted_by = auth.uid())
  )
);
