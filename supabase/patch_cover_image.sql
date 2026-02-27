-- Patch: optional cover image URL on songs
-- Run this in Supabase SQL editor (safe to execute multiple times)

ALTER TABLE songs
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;