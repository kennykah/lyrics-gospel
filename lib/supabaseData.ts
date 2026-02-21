import { supabase } from '@/lib/supabaseClient';
import type { SyncedLine } from '@/utils/lrcParser';
import { slugifyArtistName } from '@/utils/artistSlug';

export async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user?.id ?? null;
}

export async function createSong(params: {
  title: string;
  artist_name: string;
  audio_url?: string | null;
  lyrics_text?: string | null;
  created_by?: string | null;
  submitted_by?: string | null;
}) {
  const slug = `${slugify(params.title)}-${Date.now()}`;
  const audioUrl = params.audio_url?.trim() || 'local://temp-audio';
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

export async function saveSongLrcCorrection(params: {
  songId: string;
  lrcRaw: string;
  syncedLyrics: SyncedLine[];
  plainLyrics: string;
}) {
  const userId = await getCurrentUserId();

  const lrcResult = await supabase
    .from('lrc_files')
    .upsert(
      {
        song_id: params.songId,
        synced_lyrics: params.syncedLyrics,
        lrc_raw: params.lrcRaw,
        source: 'manual',
        created_by: userId,
      },
      { onConflict: 'song_id' }
    )
    .select()
    .maybeSingle();

  if (lrcResult.error) {
    return { data: null, error: lrcResult.error };
  }

  const songResult = await supabase
    .from('songs')
    .update({
      lyrics_text: params.plainLyrics,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.songId);

  if (songResult.error) {
    return { data: null, error: songResult.error };
  }

  return { data: lrcResult.data, error: null };
}

export async function updateSongWithLrc(params: {
  songId: string;
  title: string;
  artist_name: string;
  audio_url?: string | null;
  lrcRaw: string;
  syncedLyrics: SyncedLine[];
}) {
  const plainLyrics = params.syncedLyrics
    .map((line) => line.text?.trim())
    .filter(Boolean)
    .join('\n');

  const songResult = await supabase
    .from('songs')
    .update({
      title: params.title,
      artist_name: params.artist_name,
      audio_url: params.audio_url?.trim() || 'local://temp-audio',
      lyrics_text: plainLyrics,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.songId)
    .select()
    .single();

  if (songResult.error) return { data: null, error: songResult.error };

  const lrcResult = await saveSongLrcCorrection({
    songId: params.songId,
    lrcRaw: params.lrcRaw,
    syncedLyrics: params.syncedLyrics,
    plainLyrics,
  });

  if (lrcResult.error) return { data: null, error: lrcResult.error };
  return { data: songResult.data, error: null };
}

export async function deleteSongById(songId: string) {
  return supabase
    .from('songs')
    .delete()
    .eq('id', songId);
}

export async function deleteArtistWithSongs(params: { artistId?: string; artistName: string }) {
  return supabase.rpc('admin_delete_artist_with_songs', {
    p_artist_id: params.artistId ?? null,
    p_artist_name: params.artistName,
  });
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
    .limit(Math.max(limit * 3, limit));
  if (!data) return [];
  const unique = [...new Set(data.map((d: { artist_name: string }) => d.artist_name))].slice(0, limit);
  return unique;
}

export { slugifyArtistName };

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
