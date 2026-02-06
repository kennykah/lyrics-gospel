-- Gospel Lyrics - Supabase schema (minimal)

-- Profiles (optional, if using auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  role TEXT CHECK (role IN ('artist', 'contributor', 'validator', 'admin')) DEFAULT 'contributor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Songs
CREATE TABLE IF NOT EXISTS songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  artist_name TEXT NOT NULL,
  album TEXT,
  release_year INTEGER,
  audio_url TEXT NOT NULL,
  lyrics_text TEXT NOT NULL DEFAULT '',
  status TEXT CHECK (status IN (
    'draft', 'submitted', 'processing', 'pending_sync',
    'syncing', 'pending_validation', 'approved', 'published', 'rejected'
  )) DEFAULT 'published',
  category TEXT CHECK (category IN ('gospel', 'world')) DEFAULT 'gospel',
  genre TEXT,
  language TEXT,
  created_by UUID REFERENCES profiles(id),
  submitted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LRC files (synced lyrics)
CREATE TABLE IF NOT EXISTS lrc_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE UNIQUE NOT NULL,
  synced_lyrics JSONB NOT NULL DEFAULT '[]'::jsonb,
  lrc_raw TEXT,
  source TEXT CHECK (source IN ('manual', 'ai', 'hybrid')) DEFAULT 'manual',
  ai_confidence_score FLOAT CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 100),
  created_by UUID REFERENCES profiles(id),
  validated_by UUID REFERENCES profiles(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lrc_files ENABLE ROW LEVEL SECURITY;
