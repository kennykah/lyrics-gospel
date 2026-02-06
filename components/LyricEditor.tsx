'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { generateLrc, type SyncedLine } from '@/utils/lrcParser';

interface LyricEditorProps {
  onSave: (lrcContent: string, synced: SyncedLine[]) => void;
  onCancel: () => void;
}

export default function LyricEditor({ onSave, onCancel }: LyricEditorProps) {
  const [lyrics, setLyrics] = useState('');
  const [timestamps, setTimestamps] = useState<number[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Array<HTMLDivElement | null>>([]);

  const lines = useMemo(() => lyrics.split('\n').filter((line) => line.trim()), [lyrics]);

  const activeIndex = useMemo(() => {
    if (!isRecording || lines.length === 0) return -1;
    let lastTimedIndex = -1;
    for (let i = 0; i < timestamps.length; i += 1) {
      const time = timestamps[i];
      if (time > 0 && currentTime >= time) lastTimedIndex = i;
    }
    if (lastTimedIndex >= 0) return lastTimedIndex;
    const nextUnsynced = timestamps.findIndex((time) => time === 0);
    return nextUnsynced === -1 ? 0 : nextUnsynced;
  }, [currentTime, isRecording, lines.length, timestamps]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioFile) return;

    audio.src = URL.createObjectURL(audioFile);
    audio.load();

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

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

  useEffect(() => {
    if (!isRecording || activeIndex < 0) return;
    const el = lineRefs.current[activeIndex];
    if (el && listRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex, isRecording]);

  const startRecording = () => {
    if (!lyrics.trim()) {
      alert('Veuillez entrer les paroles d\'abord.');
      return;
    }
    const lines = lyrics.split('\n').filter((line) => line.trim());
    setTimestamps(new Array(lines.length).fill(0));
    setIsRecording(true);
  };

  const handleLineClick = (index: number) => {
    if (!isRecording) return;
    setTimestamps((prev) => {
      const next = [...prev];
      next[index] = currentTime;
      return next;
    });
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play();
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

  const saveLrc = () => {
    const lines = lyrics.split('\n').filter((line) => line.trim());
    const syncedLyrics = lines.map((line, index) => ({
      time: timestamps[index] || 0,
      text: line,
    }));
    const lrcContent = generateLrc(syncedLyrics);
    onSave(lrcContent, syncedLyrics);
  };

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/') && file.size <= 10 * 1024 * 1024) {
      setAudioFile(file);
    } else {
      alert('Veuillez sélectionner un fichier audio valide (max 10MB).');
    }
  };

  if (!audioFile) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Éditeur de synchronisation des paroles</h2>
        <p className="mb-4 text-gray-600">Uploadez d&apos;abord un fichier audio pour commencer la synchronisation.</p>
        <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          Choisir un fichier audio
        </button>
        <button onClick={onCancel} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 ml-4">
          Annuler
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Éditeur de synchronisation des paroles</h2>

      <audio ref={audioRef} preload="metadata" />

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Paroles (une ligne par vers)</label>
        <textarea
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          placeholder="Entrez les paroles ici, une ligne par vers..."
          className="w-full h-32 p-2 border rounded-lg"
          disabled={isRecording}
        />
      </div>

      {!isRecording ? (
        <button
          onClick={startRecording}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all"
        >
          Commencer la synchronisation
        </button>
      ) : (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Cliquez sur chaque ligne au moment où elle est chantée. Temps actuel: {formatTime(currentTime)}
          </p>
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={togglePlay}
              className="flex items-center justify-center w-12 h-12 bg-purple-600 text-white rounded-full hover:bg-purple-700"
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zM14 4h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
          <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} className="w-full" />
        </div>
      )}

      {isRecording && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Cliquez sur les lignes pour définir les timestamps</h3>
          <div ref={listRef} className="bg-gray-50 p-6 rounded-xl max-h-96 overflow-y-auto border border-gray-200">
            {lines.map((line, index) => (
              <div
                key={index}
                ref={(el) => {
                  lineRefs.current[index] = el;
                }}
                onClick={() => handleLineClick(index)}
                className={`py-3 px-4 mb-2 bg-white rounded-lg cursor-pointer hover:bg-gray-50 border border-gray-200 transition-all ${
                  timestamps[index] > 0 ? 'ring-2 ring-purple-200 bg-purple-50' : ''
                } ${
                  index === activeIndex ? 'ring-2 ring-purple-400 bg-purple-100' : ''
                }`}
              >
                <span
                  className={`text-sm font-mono mr-3 ${timestamps[index] > 0 ? 'text-purple-700 font-semibold' : 'text-gray-500'}`}
                >
                  [{formatTime(timestamps[index] || 0)}]
                </span>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex space-x-4">
        <button
          onClick={saveLrc}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!isRecording || timestamps.some((t) => t === 0)}
        >
          Sauvegarder LRC
        </button>
        <button onClick={onCancel} className="bg-gray-100 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-200 border">
          Annuler
        </button>
      </div>
    </div>
  );
}
