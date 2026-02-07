'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import type { SyncedLine } from '@/utils/lrcParser';

interface LyricPlayerProps {
  syncedLyrics: SyncedLine[];
  lrcRaw?: string;
}

export default function LyricPlayer({ syncedLyrics, lrcRaw }: LyricPlayerProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioError, setAudioError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioFile) return;

    const objectUrl = URL.createObjectURL(audioFile);
    audio.src = objectUrl;
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
      URL.revokeObjectURL(objectUrl);
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

  // Auto-scroll to active line
  useEffect(() => {
    if (currentLine < 0 || !lyricsContainerRef.current) return;
    const container = lyricsContainerRef.current;
    const activeLine = container.children[currentLine] as HTMLElement;
    if (activeLine) {
      activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentLine]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/') && file.size <= 10 * 1024 * 1024) {
      setAudioFile(file);
      setAudioError('');
    } else {
      setAudioError('Veuillez sélectionner un fichier audio valide (max 10MB).');
    }
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      await audio.play();
    } else {
      audio.pause();
    }
  };

  const seekToLine = (line: SyncedLine) => {
    if (audioRef.current) {
      audioRef.current.currentTime = line.time;
      setCurrentTime(line.time);
    }
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

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!audioFile) {
    return (
      <div className="rounded-[20px] bg-[#0d0d12] p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <p className="text-[15px] text-white/40 mb-5">
          Chargez un fichier audio pour prévisualiser la synchronisation
        </p>
        <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-primary text-[13px] py-2.5 px-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Choisir un fichier audio
        </button>
        <p className="text-[11px] text-white/20 mt-3">MP3, WAV, OGG — 10 MB max</p>
        {audioError && (
          <p className="text-red-400 text-[12px] mt-2" role="alert">{audioError}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-[20px] bg-[#0d0d12] overflow-hidden">
      <audio ref={audioRef} preload="metadata" className="hidden" />

      {/* Transport controls */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-4">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            disabled={!audioReady}
            className="w-12 h-12 rounded-full bg-white/[0.08] hover:bg-white/[0.12] flex items-center justify-center transition-all disabled:opacity-30"
          >
            {isPlaying ? (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zM14 4h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Time + Progress */}
          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] text-white/30 mb-1.5 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
            </div>
            <div className="relative h-[3px] bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-[--accent] rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <input
              type="range"
              min="0"
              max={duration || 0}
              step={0.01}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
              style={{ position: 'relative', height: '12px', marginTop: '-7px' }}
            />
          </div>
        </div>
      </div>

      {/* Lyrics */}
      <div className="relative">
        {/* Top fade */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[--player-bg] to-transparent z-10 pointer-events-none" />

        <div ref={lyricsContainerRef} className="px-6 py-4 max-h-[360px] overflow-y-auto hide-scrollbar space-y-0.5">
          {syncedLyrics.map((line, index) => {
            const isActive = index === currentLine;
            const isPast = index < currentLine;
            return (
              <button
                key={`${line.time}-${index}`}
                onClick={() => seekToLine(line)}
                className={`w-full text-left py-2 px-3 rounded-[10px] transition-all duration-300 flex items-start gap-3 ${
                  isActive
                    ? 'bg-white/[0.06]'
                    : 'hover:bg-white/[0.03]'
                }`}
              >
                <span className={`text-[11px] font-mono mt-0.5 shrink-0 transition-colors duration-300 ${
                  isActive ? 'text-[--accent]' : 'text-white/15'
                }`}>
                  {formatTime(line.time)}
                </span>
                <span className={`text-[15px] leading-relaxed transition-all duration-300 ${
                  isActive
                    ? 'text-white font-semibold scale-[1.01]'
                    : isPast
                    ? 'text-white/20'
                    : 'text-white/40'
                }`}>
                  {line.text || '\u00A0'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[--player-bg] to-transparent pointer-events-none" />
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-white/[0.04] flex items-center justify-between">
        <span className="text-[11px] text-white/20 font-mono">
          {syncedLyrics.length} lignes
        </span>
        {lrcRaw && (
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="text-[11px] text-white/20 hover:text-white/40 transition-colors flex items-center gap-1"
          >
            <svg className={`w-3 h-3 transition-transform ${showRaw ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            LRC brut
          </button>
        )}
      </div>

      {/* Raw LRC */}
      {showRaw && lrcRaw && (
        <div className="px-6 pb-5">
          <pre className="bg-white/[0.03] border border-white/[0.04] rounded-[12px] p-4 text-[11px] text-white/30 font-mono overflow-x-auto leading-relaxed max-h-48">
            {lrcRaw}
          </pre>
        </div>
      )}
    </div>
  );
}
