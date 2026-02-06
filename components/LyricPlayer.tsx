'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import type { SyncedLine } from '@/utils/lrcParser';

interface LyricPlayerProps {
  syncedLyrics: SyncedLine[];
  lrcRaw?: string;
}

export default function LyricPlayer({ syncedLyrics, lrcRaw }: LyricPlayerProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (audio.paused) {
      await audio.play();
    } else {
      audio.pause();
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

  if (!audioFile) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-200">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <p className="text-gray-600 mb-4">
          Téléchargez un fichier audio pour écouter et voir la synchronisation
        </p>
        <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-all shadow-sm hover:shadow-md"
        >
          Choisir un fichier audio
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
      <audio ref={audioRef} preload="metadata" controls className="w-full mb-6" />

      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Lecteur audio</h3>
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={togglePlay}
            disabled={!audioReady}
            className="flex items-center justify-center w-14 h-14 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zM14 4h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-gray-900">{formatTime(currentTime)}</div>
            <div className="text-sm text-gray-600">{formatTime(duration)}</div>
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>0:00</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        <h4 className="text-xl font-semibold text-gray-900 mb-6">Paroles synchronisées</h4>
        <div className="max-h-96 overflow-y-auto space-y-1">
          {syncedLyrics.map((line, index) => (
            <div
              key={`${line.time}-${index}`}
              className={`py-2 px-4 rounded-lg transition-all ${
                index === currentLine
                  ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className={`text-sm font-mono mr-3 ${index === currentLine ? 'text-white/90' : 'text-gray-500'}`}>
                {formatTime(line.time)}
              </span>
              {line.text}
            </div>
          ))}
        </div>
      </div>

      {lrcRaw && (
        <div className="mt-6">
          <details className="group">
            <summary className="flex items-center cursor-pointer text-purple-700 hover:text-purple-800 transition-colors font-medium">
              <svg className="w-5 h-5 mr-2 transform group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Voir le fichier LRC brut
            </summary>
            <div className="mt-4 bg-gray-100 rounded-lg p-4">
              <pre className="text-sm text-gray-600 overflow-x-auto font-mono">{lrcRaw}</pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
