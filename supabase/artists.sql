-- Artists table for Gospel Lyrics
-- Stores artist profiles with bio, image, featured status

CREATE TABLE IF NOT EXISTS artists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT,
  image_url TEXT,
  quote TEXT,                          -- A quote/message from the artist
  ministry TEXT,                       -- Ministry or church they belong to
  country TEXT,
  website_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,  -- { instagram, youtube, facebook, twitter, spotify }
  is_featured BOOLEAN DEFAULT FALSE,   -- Super admin can toggle featured
  featured_order INTEGER DEFAULT 0,    -- Order for featured display
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure all columns exist (safe for re-runs on existing tables)
ALTER TABLE artists ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS quote TEXT;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS ministry TEXT;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS featured_order INTEGER DEFAULT 0;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE artists ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Enable RLS
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

-- Public read access
DROP POLICY IF EXISTS "Artists are viewable by everyone" ON artists;
CREATE POLICY "Artists are viewable by everyone"
  ON artists FOR SELECT
  USING (true);

-- Only admins can insert/update/delete
DROP POLICY IF EXISTS "Admins can manage artists" ON artists;
CREATE POLICY "Admins can manage artists"
  ON artists FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_artists_slug ON artists(slug);
CREATE INDEX IF NOT EXISTS idx_artists_featured ON artists(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_artists_name ON artists(name);
