-- Patch: optional collaborations field on songs
-- Run this in Supabase SQL editor (safe to execute multiple times)

ALTER TABLE songs
ADD COLUMN IF NOT EXISTS collaborations TEXT;