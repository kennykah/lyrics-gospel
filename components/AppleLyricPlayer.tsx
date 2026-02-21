'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { SyncedLine } from '@/utils/lrcParser';

interface AppleLyricPlayerProps {
  syncedLyrics: SyncedLine[];
  lrcRaw?: string;
  audioUrl?: string | null;
}

export default function AppleLyricPlayer({ syncedLyrics, lrcRaw, audioUrl }: AppleLyricPlayerProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioError, setAudioError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const [localObjectUrl, setLocalObjectUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (!audioFile) {
      setLocalObjectUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(audioFile);
    setLocalObjectUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [audioFile]);

  const remoteAudioUrl = audioUrl?.startsWith('http') ? audioUrl : null;
  const effectiveAudioSrc = localObjectUrl || remoteAudioUrl || '';

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !effectiveAudioSrc) return;

    audio.src = effectiveAudioSrc;
    audio.load();
    setAudioReady(false);
    setCurrentTime(0);

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration);
      setAudioReady(true);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleAudioError = () => {
      setAudioReady(false);
      setAudioError('Impossible de lire cet audio. Vérifiez le lien Supabase ou chargez un fichier local.');
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleAudioError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleAudioError);
    };
  }, [effectiveAudioSrc]);

  const currentLine = useMemo(() => {
    if (!syncedLyrics.length) return -1;
    const idx = syncedLyrics.findIndex((line, index) => {
      const nextTime = syncedLyrics[index + 1]?.time ?? Infinity;
      return currentTime >= line.time && currentTime < nextTime;
    });
    return idx;
  }, [currentTime, syncedLyrics]);

  useEffect(() => {
    if (currentLine < 0) return;
    const el = lineRefs.current[currentLine];
    if (el && listRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentLine]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/') && file.size <= 10 * 1024 * 1024) {
      setAudioFile(file);
      setAudioError('');
      setCurrentTime(0);
      setAudioReady(false);
    } else {
      setAudioError('Veuillez sélectionner un fichier audio valide (max 10MB).');
    }
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) await audio.play();
    else audio.pause();
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(event.target.value);
    setCurrentTime(time);
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  const seekToLine = (index: number) => {
    const time = syncedLyrics[index]?.time;
    if (time !== undefined && audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skipBack = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 5);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-[24px] bg-white/[0.04] border border-white/[0.06] overflow-hidden">
      <audio ref={audioRef} preload="metadata" className="hidden" />

      {!effectiveAudioSrc ? (
        <div className="p-8 text-center border-b border-white/[0.06]">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/[0.06] flex items-center justify-center">
            <svg className="w-7 h-7 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
            </svg>
          </div>
          <p className="text-white/40 text-[14px] mb-4">Chargez un fichier audio pour écouter avec les paroles synchronisées</p>
          <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="btn-primary text-[13px] py-2.5 px-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Choisir un audio
          </button>
          <p className="text-white/20 text-[11px] mt-2">Aucun audio enregistré. Chargez un fichier local (max 10 MB).</p>
          {audioError && <p className="text-red-400 text-[12px] mt-2" role="alert">{audioError}</p>}
        </div>
      ) : (
        <div className="px-8 py-6 border-b border-white/[0.06]">
          <div className="flex items-center justify-end mb-3">
            <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="text-[11px] text-white/35 hover:text-white/60 transition-colors">
              Remplacer l&apos;audio
            </button>
          </div>
          <div className="mb-5">
            <div className="relative h-1 bg-white/[0.08] rounded-full overflow-hidden group cursor-pointer">
              <div className="absolute left-0 top-0 h-full bg-white/60 rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
              <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
            </div>
            <div className="flex justify-between mt-1.5 text-[11px] text-white/30 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button onClick={skipBack} className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors" aria-label="Reculer 5s">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.5 8.14v-4.5l-7 7 7 7v-4.5c5 0 8.5 1.5 11 5.5-1-5-4-10-11-10.5z" /></svg>
            </button>

            <button onClick={togglePlay} disabled={!audioReady} className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-black disabled:opacity-30 hover:scale-105 active:scale-95 transition-transform shadow-lg" aria-label={isPlaying ? 'Pause' : 'Lecture'}>
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zM14 4h4v16h-4V4z" /></svg>
              ) : (
                <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>

            <button onClick={skipForward} className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors" aria-label="Avancer 5s">
              <svg className="w-5 h-5 scale-x-[-1]" fill="currentColor" viewBox="0 0 24 24"><path d="M12.5 8.14v-4.5l-7 7 7 7v-4.5c5 0 8.5 1.5 11 5.5-1-5-4-10-11-10.5z" /></svg>
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <div className="absolute top-4 right-6 text-[11px] text-white/20 font-mono">
          {currentLine >= 0 ? currentLine + 1 : '—'} / {syncedLyrics.length} lines
        </div>

        <div ref={listRef} className="max-h-[55vh] overflow-y-auto py-8 px-8 hide-scrollbar">
          <div className="space-y-1">
            {syncedLyrics.map((line, index) => {
              const active = index === currentLine;
              const past = currentLine >= 0 && index < currentLine;

              return (
                <div
                  key={`${line.time}-${index}`}
                  ref={(el) => {
                    lineRefs.current[index] = el;
                  }}
                  onClick={() => seekToLine(index)}
                  className={`
                    py-2 px-3 rounded-[12px] cursor-pointer transition-all duration-500 ease-out
                    ${active ? 'bg-white/[0.08]' : 'hover:bg-white/[0.03]'}
                  `}
                >
                  <div className="flex items-baseline gap-3">
                    <span className={`text-[11px] font-mono flex-shrink-0 w-14 transition-colors duration-300 ${
                      active ? 'text-[--accent]' : past ? 'text-white/15' : 'text-white/20'
                    }`}>
                      {formatTime(line.time)}
                    </span>

                    <span className={`transition-all duration-500 ease-out leading-relaxed ${
                      active
                        ? 'text-white text-xl md:text-2xl font-semibold'
                        : past
                          ? 'text-white/20 text-base md:text-lg'
                          : 'text-white/35 text-base md:text-lg'
                    }`}>
                      {line.text || '\u00A0'}
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="h-32" />
          </div>
        </div>

        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-[rgb(13,13,18)] to-transparent pointer-events-none z-10 rounded-t-[24px]" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[rgb(13,13,18)] to-transparent pointer-events-none z-10" />
      </div>

      {lrcRaw && (
        <div className="px-8 py-4 border-t border-white/[0.06]">
          <details className="group">
            <summary className="cursor-pointer text-[13px] text-white/30 hover:text-white/50 transition-colors flex items-center gap-2">
              <svg className="w-3.5 h-3.5 transform group-open:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              Voir le LRC brut
            </summary>
            <pre className="mt-3 text-[11px] text-white/25 bg-white/[0.03] p-4 rounded-[12px] overflow-x-auto font-mono leading-relaxed">{lrcRaw}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
