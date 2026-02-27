-- Patch: optional artist banner image URL
-- Run this in Supabase SQL editor (safe to execute multiple times)

ALTER TABLE artists
ADD COLUMN IF NOT EXISTS banner_url TEXT;