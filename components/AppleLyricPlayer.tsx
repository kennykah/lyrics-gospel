'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { SyncedLine } from '@/utils/lrcParser';

interface AppleLyricPlayerProps {
  syncedLyrics: SyncedLine[];
  lrcRaw?: string;
}

export default function AppleLyricPlayer({ syncedLyrics, lrcRaw }: AppleLyricPlayerProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioFile) return;

    audio.src = URL.createObjectURL(audioFile);
    audio.load();

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

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioFile]);

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
    } else {
      alert('Veuillez sélectionner un fichier audio valide (max 10MB).');
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

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-3xl bg-white/10 border border-white/10 backdrop-blur-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/50">Now Playing</p>
          <p className="text-lg font-semibold text-white">Synchronised Lyrics</p>
        </div>
        <div className="text-sm text-white/70">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      <div className="mb-6">
        <audio ref={audioRef} preload="metadata" className="hidden" />
        {!audioFile ? (
          <div className="flex items-center gap-3">
            <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              Choisir un audio
            </button>
            <span className="text-sm text-white/60">Audio local temporaire</span>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              disabled={!audioReady}
              className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-50"
            >
              {isPlaying ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 4h4v16H6V4zM14 4h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
            />
          </div>
        )}
      </div>

      <div ref={listRef} className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
        {syncedLyrics.map((line, index) => {
          const active = index === currentLine;
          return (
            <div
              key={`${line.time}-${index}`}
              ref={(el) => {
                lineRefs.current[index] = el;
              }}
              className={`transition-all duration-300 ease-out ${
                active
                  ? 'text-white text-2xl md:text-3xl font-semibold scale-[1.02]'
                  : 'text-white/50 text-lg md:text-xl'
              }`}
            >
              <span className={`mr-3 text-xs ${active ? 'text-white/70' : 'text-white/30'}`}>
                {formatTime(line.time)}
              </span>
              {line.text}
            </div>
          );
        })}
      </div>

      {lrcRaw && (
        <div className="mt-6">
          <details className="group">
            <summary className="cursor-pointer text-sm text-white/60 hover:text-white/80">
              Voir le LRC brut
            </summary>
            <pre className="mt-3 text-xs text-white/60 bg-white/5 p-3 rounded-lg overflow-x-auto">{lrcRaw}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
