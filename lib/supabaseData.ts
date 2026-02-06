import { supabase } from '@/lib/supabaseClient';
import type { SyncedLine } from '@/utils/lrcParser';

export async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user?.id ?? null;
}

export async function createSong(params: {
  title: string;
  artist_name: string;
  lyrics_text?: string | null;
  created_by?: string | null;
  submitted_by?: string | null;
}) {
  const slug = `${slugify(params.title)}-${Date.now()}`;
  const audioUrl = 'local://temp-audio';
  return supabase
    .from('songs')
    .insert({
      title: params.title,
      slug,
      artist_name: params.artist_name,
      audio_url: audioUrl,
      lyrics_text: params.lyrics_text ?? '',
      submitted_by: params.submitted_by ?? params.created_by ?? null,
      status: 'published',
    })
    .select()
    .single();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80);
}

export async function createLrcFile(params: {
  song_id: string;
  synced_lyrics: SyncedLine[];
  lrc_raw: string;
  source: 'manual' | 'ai' | 'hybrid';
  created_by?: string | null;
}) {
  return supabase
    .from('lrc_files')
    .insert({
      song_id: params.song_id,
      synced_lyrics: params.synced_lyrics,
      lrc_raw: params.lrc_raw,
      source: params.source,
      created_by: params.created_by ?? null,
    })
    .select()
    .single();
}

export async function fetchSongs(params: { page: number; pageSize: number; query?: string }) {
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;
  const base = supabase
    .from('songs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.query?.trim()) {
    const q = params.query.trim();
    return base.or(`title.ilike.%${q}%,artist_name.ilike.%${q}%`);
  }

  return base;
}

export async function fetchSongById(id: string) {
  return supabase.from('songs').select('*').eq('id', id).single();
}

export async function fetchLrcBySongId(songId: string) {
  return supabase.from('lrc_files').select('*').eq('song_id', songId).single();
}
