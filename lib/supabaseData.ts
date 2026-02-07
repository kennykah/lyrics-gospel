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
  return supabase.from('lrc_files').select('*').eq('song_id', songId).maybeSingle();
}

export async function fetchRecentSongs(limit = 6) {
  return supabase
    .from('songs')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit);
}

export async function fetchSongCount() {
  const { count } = await supabase
    .from('songs')
    .select('*', { count: 'exact', head: true });
  return count || 0;
}

export async function fetchLrcCount() {
  const { count } = await supabase
    .from('lrc_files')
    .select('*', { count: 'exact', head: true });
  return count || 0;
}

export async function fetchRelatedSongs(songId: string, artistName: string, limit = 4) {
  return supabase
    .from('songs')
    .select('*')
    .eq('status', 'published')
    .neq('id', songId)
    .order('created_at', { ascending: false })
    .limit(limit);
}

export async function fetchDistinctArtists(limit = 10) {
  const { data } = await supabase
    .from('songs')
    .select('artist_name')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(50);
  if (!data) return [];
  const unique = [...new Set(data.map((d: { artist_name: string }) => d.artist_name))].slice(0, limit);
  return unique;
}

/* ─── Artist functions ─── */

export async function fetchAllArtists() {
  return supabase
    .from('artists')
    .select('*')
    .order('name', { ascending: true });
}

export async function fetchFeaturedArtist() {
  const { data } = await supabase
    .from('artists')
    .select('*')
    .eq('is_featured', true)
    .order('featured_order', { ascending: true })
    .limit(1);
  return data?.[0] || null;
}

export async function fetchArtistBySlug(slug: string) {
  return supabase
    .from('artists')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
}

export async function fetchSongsByArtistName(artistName: string, limit = 20) {
  return supabase
    .from('songs')
    .select('*')
    .eq('status', 'published')
    .ilike('artist_name', artistName)
    .order('created_at', { ascending: false })
    .limit(limit);
}

export async function fetchArtistSongCount(artistName: string) {
  const { count } = await supabase
    .from('songs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .ilike('artist_name', artistName);
  return count || 0;
}

export async function toggleFeaturedArtist(artistId: string, featured: boolean) {
  // If featuring, unflag all others first
  if (featured) {
    await supabase.from('artists').update({ is_featured: false }).eq('is_featured', true);
  }
  return supabase
    .from('artists')
    .update({ is_featured: featured, updated_at: new Date().toISOString() })
    .eq('id', artistId);
}

export async function fetchUserRole() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return null;
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();
  return data?.role || null;
}
