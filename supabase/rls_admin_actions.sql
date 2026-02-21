-- Admin RLS patch for advanced actions
-- Execute this script after schema.sql + rls.sql

-- Remove permissive contributor policies from base rls.sql
DROP POLICY IF EXISTS "songs_insert_authenticated" ON songs;
DROP POLICY IF EXISTS "songs_update_own" ON songs;
DROP POLICY IF EXISTS "lrc_insert_authenticated" ON lrc_files;
DROP POLICY IF EXISTS "lrc_update_own" ON lrc_files;

-- songs: admins can insert/update/delete any row
DROP POLICY IF EXISTS "songs_insert_admin" ON songs;
CREATE POLICY "songs_insert_admin"
ON songs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);

-- songs: admins can update/delete any row
DROP POLICY IF EXISTS "songs_update_admin" ON songs;
CREATE POLICY "songs_update_admin"
ON songs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "songs_delete_admin" ON songs;
CREATE POLICY "songs_delete_admin"
ON songs FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);

-- lrc_files: admins can insert/update/delete any row
DROP POLICY IF EXISTS "lrc_insert_admin" ON lrc_files;
CREATE POLICY "lrc_insert_admin"
ON lrc_files FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "lrc_update_admin" ON lrc_files;
CREATE POLICY "lrc_update_admin"
ON lrc_files FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "lrc_delete_admin" ON lrc_files;
CREATE POLICY "lrc_delete_admin"
ON lrc_files FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);
