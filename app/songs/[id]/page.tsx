'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchLrcBySongId, fetchSongById } from '@/lib/supabaseData';
import type { Song, LrcFile } from '@/types';
import AppleLyricPlayer from '@/components/AppleLyricPlayer';

export default function SongDetailPage() {
  const params = useParams<{ id: string }>();
  const songId = params?.id as string;
  const [song, setSong] = useState<Song | null>(null);
  const [lrc, setLrc] = useState<LrcFile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: songData } = await fetchSongById(songId);
      const { data: lrcData } = await fetchLrcBySongId(songId);
      setSong(songData as Song);
      setLrc(lrcData as LrcFile);
      setLoading(false);
    };
    if (songId) load();
  }, [songId]);

  const syncedLyrics = useMemo(() => lrc?.synced_lyrics || [], [lrc]);

  if (loading) {
    return <div className="container mx-auto px-6 py-12">Chargement...</div>;
  }

  if (!song) {
    return (
      <div className="container mx-auto px-6 py-12">
        <p className="text-gray-600">Chanson introuvable.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f14] via-[#141421] to-[#0f0f14] text-white">
      <div className="container mx-auto px-6 py-10">
        <Link href="/songs" className="text-sm text-purple-300 hover:text-purple-200">
          ← Retour aux chansons
        </Link>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
          <div className="rounded-3xl bg-white/10 backdrop-blur-xl p-6 border border-white/10">
            <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-purple-600/50 to-pink-500/40" />
            <h1 className="mt-6 text-2xl font-semibold">{song.title}</h1>
            <p className="text-white/70">{song.artist_name}</p>
            <div className="mt-4 text-sm text-white/60 space-y-1">
              {song.album && <div>Album: {song.album}</div>}
              {song.release_year && <div>Année: {song.release_year}</div>}
              <div>Status: {song.status}</div>
            </div>
          </div>

          <div>
            {syncedLyrics.length > 0 ? (
              <AppleLyricPlayer syncedLyrics={syncedLyrics} lrcRaw={lrc?.lrc_raw} />
            ) : (
              <div className="rounded-3xl bg-white/10 p-6 border border-white/10">
                <p className="text-white/70">Aucun LRC synchronisé pour cette chanson.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
