export interface Song {
  id: string;
  title: string;
  slug?: string;
  artist_name: string;
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
