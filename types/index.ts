export interface Song {
  id: string;
  title: string;
  slug?: string;
  artist_name: string;
  collaborations?: string | null;
  album?: string;
  release_year?: number;
  audio_url?: string;
  lyrics_text?: string;
  status: 'draft' | 'published' | 'archived' | 'submitted' | 'processing' | 'pending_sync' | 'syncing' | 'pending_validation' | 'approved' | 'rejected';
  category?: 'gospel' | 'world';
  genre?: string;
  language?: string;
  created_by?: string;
  submitted_by?: string;
  created_at?: string;
}

export interface LrcFile {
  id: string;
  song_id: string;
  synced_lyrics: { time: number; text: string }[];
  lrc_raw: string;
  source: 'manual' | 'ai' | 'hybrid';
  quality_score?: number;
  validated_by?: string;
  validated_at?: string;
}

export interface Artist {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  image_url?: string;
  quote?: string;
  ministry?: string;
  country?: string;
  website_url?: string;
  social_links?: {
    instagram?: string;
    youtube?: string;
    facebook?: string;
    twitter?: string;
    spotify?: string;
  };
  is_featured?: boolean;
  featured_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AdminSongStatsRow {
  song_id: string;
  title: string;
  artist_name: string;
  visit_count: number;
  play_count: number;
  last_activity: string;
}
