'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getPersistentAudioElement } from '@/lib/persistentAudio';
import { getPlayerTrack, setPlayerTrack, subscribePlayerTrack, type PlayerTrackMeta } from '@/lib/playerSession';

export default function FloatingMiniPlayer() {
  const pathname = usePathname();
  const [track, setTrack] = useState<PlayerTrackMeta | null>(getPlayerTrack());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribePlayerTrack(setTrack);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const audio = getPersistentAudioElement();
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTime = () => setCurrentTime(audio.currentTime || 0);
    const handleMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);

    const frame = window.requestAnimationFrame(() => {
      setIsPlaying(!audio.paused);
      setCurrentTime(audio.currentTime || 0);
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    });

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTime);
    audio.addEventListener('loadedmetadata', handleMeta);

    return () => {
      window.cancelAnimationFrame(frame);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTime);
      audio.removeEventListener('loadedmetadata', handleMeta);
    };
  }, []);

  const isOnCurrentSongPage = useMemo(() => {
    if (!track?.songId) return false;
    return pathname === `/songs/${track.songId}`;
  }, [pathname, track?.songId]);

  const shouldShow = Boolean(track?.songId) && !isOnCurrentSongPage;
  if (!shouldShow) return null;

  const audio = getPersistentAudioElement();
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const togglePlay = async () => {
    if (!audio) return;
    if (audio.paused) await audio.play();
    else audio.pause();
  };

  const closeMiniPlayer = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlayerTrack(null);
  };

  return (
    <div className="fixed right-3 bottom-3 sm:right-5 sm:bottom-5 z-[90] w-[300px] max-w-[calc(100vw-24px)] rounded-[16px] bg-[rgba(13,13,18,0.92)] border border-white/[0.12] shadow-2xl backdrop-blur-md p-3">
      <div className="flex items-center gap-3">
        {track?.coverImageUrl ? (
          <img src={track.coverImageUrl} alt={track.title} className="w-12 h-12 rounded-[10px] object-cover flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-[10px] bg-white/[0.08] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
            </svg>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-white font-semibold truncate">{track?.title}</p>
          <p className="text-[11px] text-white/60 truncate">{track?.artistName}</p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            aria-label={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zM14 4h4v16h-4V4z" /></svg>
            ) : (
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          <button
            onClick={closeMiniPlayer}
            className="w-8 h-8 rounded-full bg-white/[0.1] hover:bg-white/[0.18] text-white/75 flex items-center justify-center transition-colors"
            aria-label="Fermer le mini lecteur"
            title="Fermer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-2.5 h-1 rounded-full bg-white/[0.12] overflow-hidden">
        <div className="h-full bg-white/70" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-2 flex justify-end">
        <Link
          href={`/songs/${track?.songId}`}
          className="inline-flex items-center h-7 px-2.5 rounded-[8px] bg-white/[0.14] hover:bg-white/[0.22] text-[11px] text-white font-medium transition-colors"
        >
          Revenir à la chanson
        </Link>
      </div>
    </div>
  );
}
