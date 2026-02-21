-- Supabase Storage setup for song audio files
-- Bucket: song-audio (public read, authenticated write)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'song-audio',
  'song-audio',
  true,
  52428800,
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/flac', 'audio/mp4', 'audio/aac', 'audio/webm']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can read song audio" ON storage.objects;
CREATE POLICY "Public can read song audio"
ON storage.objects
FOR SELECT
USING (bucket_id = 'song-audio');

DROP POLICY IF EXISTS "Authenticated can upload song audio" ON storage.objects;
CREATE POLICY "Authenticated can upload song audio"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'song-audio'
  AND owner = auth.uid()
);

DROP POLICY IF EXISTS "Authenticated can update own song audio" ON storage.objects;
CREATE POLICY "Authenticated can update own song audio"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'song-audio'
  AND owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'song-audio'
  AND owner = auth.uid()
);

DROP POLICY IF EXISTS "Authenticated can delete own song audio" ON storage.objects;
CREATE POLICY "Authenticated can delete own song audio"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'song-audio'
  AND owner = auth.uid()
);
