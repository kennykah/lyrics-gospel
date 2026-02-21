'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { generateLrc, type SyncedLine } from '@/utils/lrcParser';

interface LyricEditorProps {
  onSave: (lrcContent: string, synced: SyncedLine[], audioFile: File | null, audioUrl: string | null) => void;
  onCancel: () => void;
  initialLyrics?: string;
  initialSyncedLyrics?: SyncedLine[];
  isEditMode?: boolean;
  initialAudioUrl?: string | null;
}

type EditorStep = 'upload' | 'lyrics' | 'sync' | 'review';

export default function LyricEditor({
  onSave,
  onCancel,
  initialLyrics = '',
  initialSyncedLyrics = [],
  isEditMode = false,
  initialAudioUrl = null,
}: LyricEditorProps) {
  // ── State ──
  const [step, setStep] = useState<EditorStep>('upload');
  const [lyrics, setLyrics] = useState(initialLyrics);
  const [timestamps, setTimestamps] = useState<number[]>(initialSyncedLyrics.map((line) => line.time || 0));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl);
  const [audioError, setAudioError] = useState('');
  const [glowActive, setGlowActive] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  const [history, setHistory] = useState<number[][]>([]);

  useEffect(() => {
    setAudioUrl(initialAudioUrl || null);
  }, [initialAudioUrl]);

  useEffect(() => {
    if (initialSyncedLyrics.length > 0) {
      setLyrics(initialSyncedLyrics.map((line) => line.text).join('\n'));
      setTimestamps(initialSyncedLyrics.map((line) => line.time || 0));
      return;
    }

    setLyrics(initialLyrics);
    setTimestamps([]);
  }, [initialLyrics, initialSyncedLyrics]);

  // ── Refs ──
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Array<HTMLDivElement | null>>([]);

  // ── Derived ──
  const lines = useMemo(() => lyrics.split('\n').filter((line) => line.trim()), [lyrics]);
  const syncedCount = useMemo(() => timestamps.filter((t) => t > 0).length, [timestamps]);
  const totalCount = lines.length;
  const syncProgress = totalCount > 0 ? (syncedCount / totalCount) * 100 : 0;

  // Next unsynced line index
  const nextUnsyncedIndex = useMemo(() => {
    const idx = timestamps.findIndex((t) => t === 0);
    return idx === -1 ? totalCount : idx;
  }, [timestamps, totalCount]);

  const playbackActiveIndex = useMemo(() => {
    if (step !== 'sync') return -1;
    let idx = -1;
    for (let i = 0; i < timestamps.length; i += 1) {
      const timestamp = timestamps[i];
      if (timestamp > 0 && timestamp <= currentTime) {
        idx = i;
      }
    }
    return idx;
  }, [step, timestamps, currentTime]);

  const syncTargetIndex = useMemo(() => {
    if (nextUnsyncedIndex < totalCount) return nextUnsyncedIndex;
    return Math.max(0, totalCount - 1);
  }, [nextUnsyncedIndex, totalCount]);

  // Current active line during sync
  const activeIndex = useMemo(() => {
    if (step !== 'sync') return -1;
    if (isEditMode) return playbackActiveIndex >= 0 ? playbackActiveIndex : syncTargetIndex;
    return syncTargetIndex;
  }, [step, isEditMode, playbackActiveIndex, syncTargetIndex]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const allSynced = syncedCount === totalCount && totalCount > 0;
  const showCompletedState = allSynced && !isEditMode;

  // ── Audio setup ──
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const remoteUrl = audioUrl?.startsWith('http') ? audioUrl : null;
    const objectUrl = audioFile ? URL.createObjectURL(audioFile) : null;
    const source = objectUrl || remoteUrl;
    if (!source) return;

    audio.src = source;
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
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioFile, audioUrl]);

  // ── Auto-scroll to active line ──
  useEffect(() => {
    if (step !== 'sync' || activeIndex < 0) return;
    const el = lineRefs.current[activeIndex];
    if (el && listRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex, step]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    if (step !== 'sync') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTapSync();
      } else if (e.code === 'Backspace' || (e.ctrlKey && e.code === 'KeyZ')) {
        e.preventDefault();
        handleUndo();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        skipBack();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        skipForward();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // ── Actions ──
  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      setAudioError('Format non supporté. Veuillez choisir un fichier audio (MP3, WAV, M4A...).');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setAudioError('Fichier trop volumineux (max 20 Mo).');
      return;
    }
    setAudioFile(file);
    setAudioUrl(null);
    setAudioError('');
    setCurrentTime(0);

    if (initialSyncedLyrics.length > 0) {
      setHistory([]);
      setStep('sync');
      setTimeout(() => {
        const audio = audioRef.current;
        if (audio) {
          audio.currentTime = 0;
          audio.play();
        }
      }, 250);
      return;
    }

    setStep('lyrics');
  };

  const startSync = () => {
    if (!lyrics.trim()) return;
    const parsedLines = lyrics.split('\n').filter((l) => l.trim());
    setTimestamps(new Array(parsedLines.length).fill(0));
    setHistory([]);
    setStep('sync');
    setCurrentTime(0);

    // Auto-play audio (local mode)
    setTimeout(() => {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play();
      }
    }, 300);
  };

  const handleTapSync = useCallback(() => {
    if (step !== 'sync') return;
    const nextIdx = timestamps.findIndex((t) => t === 0);
    if (nextIdx === -1) return;

    // Save history for undo
    setHistory((prev) => [...prev, [...timestamps]]);

    setTimestamps((prev) => {
      const next = [...prev];
      next[nextIdx] = currentTime;
      return next;
    });

    setGlowActive(true);
    setTimeout(() => setGlowActive(false), 300);
  }, [step, timestamps, currentTime]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setTimestamps(previousState);
    setHistory((prev) => prev.slice(0, -1));
  }, [history]);

  const handleResyncLine = (index: number) => {
    if (step !== 'sync') return;
    setHistory((prev) => [...prev, [...timestamps]]);
    setTimestamps((prev) => {
      const next = [...prev];
      next[index] = currentTime;
      return next;
    });
    setGlowActive(true);
    setTimeout(() => setGlowActive(false), 300);
  };

  const handleClearLine = (index: number) => {
    setHistory((prev) => [...prev, [...timestamps]]);
    setTimestamps((prev) => {
      const next = [...prev];
      next[index] = 0;
      return next;
    });
  };

  const adjustTiming = (index: number, delta: number) => {
    setHistory((prev) => [...prev, [...timestamps]]);
    setTimestamps((prev) => {
      const next = [...prev];
      next[index] = Math.max(0, next[index] + delta);
      return next;
    });
  };

  const restartSync = () => {
    setTimestamps(new Array(lines.length).fill(0));
    setHistory([]);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
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

  const cycleRate = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5];
    const idx = rates.indexOf(playbackRate);
    const next = rates[(idx + 1) % rates.length];
    setPlaybackRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const skipBack = () => {
    if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
  };

  const skipForward = () => {
    if (audioRef.current) audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 5);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const cs = Math.floor((time % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  };

  const formatTimeShort = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const saveLrc = () => {
    const filteredLines = lyrics.split('\n').filter((line) => line.trim());
    const syncedLyrics = filteredLines.map((line, index) => ({
      time: timestamps[index] || 0,
      text: line,
    }));
    const lrcContent = generateLrc(syncedLyrics);
    onSave(lrcContent, syncedLyrics, audioFile, audioUrl);
  };

  const goToReview = () => {
    setIsPlaying(false);
    if (audioRef.current) audioRef.current.pause();
    setStep('review');
  };

  const goBackToSync = () => {
    setStep('sync');
  };

  const goBackToLyrics = () => {
    setStep('lyrics');
    setIsPlaying(false);
    if (audioRef.current) audioRef.current.pause();
  };

  // ── Step indicator ──
  const steps: { key: EditorStep; label: string; icon: string }[] = [
    { key: 'upload', label: 'Audio', icon: '🎵' },
    { key: 'lyrics', label: 'Paroles', icon: '📝' },
    { key: 'sync', label: 'Synchro', icon: '⏱️' },
    { key: 'review', label: 'Aperçu', icon: '✅' },
  ];
  const stepOrder: EditorStep[] = ['upload', 'lyrics', 'sync', 'review'];
  const currentStepIndex = stepOrder.indexOf(step);

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  return (
    <div className="rounded-[20px] bg-[#0d0d12] border border-[rgba(255,255,255,0.08)] overflow-hidden shadow-2xl">
      <audio ref={audioRef} preload="metadata" />

      {/* ── Step progress bar ── */}
      <div className="px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {steps.map((s, i) => {
            const isActive = i === currentStepIndex;
            const isDone = i < currentStepIndex;
            return (
              <div key={s.key} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`
                      w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                      ${isActive
                        ? 'bg-[--accent] text-white shadow-lg shadow-[--accent]/30 scale-110'
                        : isDone
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-white/[0.06] text-white/30 border border-white/[0.08]'
                      }
                    `}
                  >
                    {isDone ? '✓' : s.icon}
                  </div>
                  <span className={`text-[10px] font-medium tracking-wide ${
                    isActive ? 'text-white' : isDone ? 'text-green-400/70' : 'text-white/25'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-12 h-px mx-2 mb-5 transition-colors ${
                    i < currentStepIndex ? 'bg-green-500/40' : 'bg-white/[0.08]'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ STEP 1: Upload Audio ═══ */}
      {step === 'upload' && (
        <div className="p-10 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[--accent]/10 border border-[--accent]/20 flex items-center justify-center">
            <svg className="w-9 h-9 text-[--accent]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Commencer la synchronisation</h3>
          <p className="text-[14px] text-white/50 mb-8 max-w-md mx-auto leading-relaxed">
            Chargez un fichier audio pour créer un fichier LRC synchronisé.<br />
            Formats supportés : MP3, WAV, M4A, OGG, FLAC (max 20 Mo)
          </p>
          <div className="flex items-center justify-center gap-3">
            <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-[--accent] text-white font-semibold text-[15px] hover:bg-[--accent-hover] hover:shadow-lg hover:shadow-[--accent]/25 active:scale-[0.97] transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Choisir un fichier audio
            </button>
            {audioUrl?.startsWith('http') && (
              <button
                onClick={() => {
                  setAudioFile(null);
                  setAudioError('');
                  setCurrentTime(0);
                  if (initialSyncedLyrics.length > 0) {
                    setHistory([]);
                    setStep('sync');
                  } else {
                    setStep('lyrics');
                  }
                  setTimeout(() => {
                    const audio = audioRef.current;
                    if (audio) {
                      audio.currentTime = 0;
                      audio.play();
                    }
                  }, 250);
                }}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-white/[0.06] text-white/70 font-semibold text-[15px] border border-white/[0.1] hover:bg-white/[0.1] transition-all"
              >
                Utiliser l&apos;audio déjà enregistré
              </button>
            )}
            <button
              onClick={onCancel}
              className="px-5 py-3.5 rounded-2xl bg-white/[0.06] text-white/50 font-medium text-[15px] border border-white/[0.08] hover:bg-white/[0.1] hover:text-white/70 transition-all"
            >
              Annuler
            </button>
          </div>
          {audioError && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-red-400 text-[13px]">{audioError}</p>
            </div>
          )}

        </div>
      )}

      {/* ═══ STEP 2: Enter Lyrics ═══ */}
      {step === 'lyrics' && (
        <div className="p-6">
          {/* Audio file indicator */}
          <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-green-400">Audio chargé</p>
              <p className="text-[11px] text-white/30 truncate">{audioFile?.name || 'Audio enregistré (Supabase)'}</p>
            </div>
            <button
              onClick={() => { setStep('upload'); setAudioFile(null); setAudioUrl(null); }}
              className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
            >
              Changer
            </button>
          </div>

          {/* Lyrics input */}
          <div className="mb-4">
            <label className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-white/70">
                Collez ou tapez les paroles
              </span>
              <span className="text-[11px] text-white/30">
                {lines.length} ligne{lines.length > 1 ? 's' : ''} détectée{lines.length > 1 ? 's' : ''}
              </span>
            </label>
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder={"Entrez les paroles ici...\nUne ligne par vers\n\nExemple :\nAmazing grace how sweet the sound\nThat saved a wretch like me\nI once was lost but now am found\nWas blind but now I see"}
              className="w-full min-h-[320px] bg-white/[0.04] border border-white/[0.1] rounded-2xl p-5 text-[15px] leading-relaxed text-white placeholder:text-white/20 resize-none focus:outline-none focus:border-[--accent]/50 focus:ring-1 focus:ring-[--accent]/20 transition-all font-mono"
              autoFocus
            />
          </div>

          {/* Tip */}
          <div className="mb-5 px-4 py-3 rounded-xl bg-[--accent]/5 border border-[--accent]/10">
            <p className="text-[12px] text-white/40 leading-relaxed">
              <strong className="text-[--accent]/80">Astuce :</strong> Chaque ligne représente un vers. Les lignes vides seront ignorées. Assurez-vous que les paroles correspondent à l&apos;audio.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={startSync}
              disabled={!lyrics.trim() || lines.length === 0}
              className="inline-flex items-center gap-2.5 px-7 py-3 rounded-2xl bg-[--accent] text-white font-semibold text-[14px] hover:bg-[--accent-hover] active:scale-[0.97] transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
              </svg>
              Commencer la synchronisation
            </button>
            <button
              onClick={onCancel}
              className="px-5 py-3 rounded-2xl bg-white/[0.06] text-white/50 font-medium text-[14px] border border-white/[0.08] hover:bg-white/[0.1] hover:text-white/70 transition-all"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ═══ STEP 3: Sync Mode (Musixmatch-style) ═══ */}
      {step === 'sync' && (
        <div className="flex flex-col">
          {/* ── Compact audio player ── */}
          <div className="px-6 py-3 border-b border-white/[0.08] bg-white/[0.02]">
            {isEditMode && (
              <div className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[--accent]/12 border border-[--accent]/25 text-[11px] font-medium text-[--accent]">
                Mode édition de synchronisation
              </div>
            )}

            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-transform shadow-md flex-shrink-0"
                aria-label={isPlaying ? 'Pause' : 'Lecture'}
              >
                {isPlaying ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zM14 4h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Time + Scrubber */}
              <div className="flex-1 flex items-center gap-3">
                <span className="text-[11px] font-mono text-white/40 w-10 text-right flex-shrink-0">
                  {formatTimeShort(currentTime)}
                </span>
                <div className="flex-1 relative h-6 flex items-center">
                  <div className="absolute inset-x-0 h-1 bg-white/[0.08] rounded-full">
                    <div
                      className="h-full bg-[--accent] rounded-full transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    step="0.01"
                    className="absolute inset-x-0 w-full h-6 opacity-0 cursor-pointer"
                  />
                </div>
                <span className="text-[11px] font-mono text-white/40 w-10 flex-shrink-0">
                  {formatTimeShort(duration)}
                </span>
              </div>

              {/* Transport controls */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={skipBack} className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.1] transition-all" aria-label="Reculer 5s" title="-5s">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button onClick={skipForward} className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.1] transition-all" aria-label="Avancer 5s" title="+5s">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
                <button onClick={cycleRate} className="h-8 px-2 rounded-lg bg-white/[0.06] text-[11px] font-mono text-white/50 hover:text-white/70 hover:bg-white/[0.1] transition-all" title="Vitesse">
                  {playbackRate}x
                </button>
              </div>
            </div>

            {/* Sync progress */}
            <div className="mt-2 flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[--accent] to-green-400 rounded-full transition-all duration-300"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
              <span className="text-[11px] text-white/40 font-medium flex-shrink-0">
                {syncedCount}/{totalCount}
              </span>
            </div>
          </div>

          {/* ── Main sync area: Focus line + list ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] min-h-[420px]">

            {/* LEFT: Focus area (current + next lines) */}
            <div className="flex flex-col border-r border-white/[0.06]">
              {/* Current line highlight */}
              <div className="flex-1 flex flex-col items-center justify-center px-8 py-6">
                {!showCompletedState ? (
                  <>
                    {/* Previous synced line (faded) */}
                    {activeIndex > 0 && (
                      <p className="text-[14px] text-white/20 mb-4 text-center max-w-lg leading-relaxed">
                        {lines[activeIndex - 1]}
                      </p>
                    )}

                    {/* CURRENT LINE (big, glowing) */}
                    <div className={`text-center transition-all duration-200 ${glowActive ? 'scale-[1.02]' : ''}`}>
                      <p className="text-[11px] uppercase tracking-widest text-[--accent]/60 font-semibold mb-2">
                        Ligne {activeIndex + 1} sur {totalCount}
                      </p>
                      <p className={`text-2xl md:text-3xl font-bold text-white leading-snug max-w-lg transition-all ${
                        glowActive ? 'text-[--accent] drop-shadow-[0_0_20px_rgba(108,92,231,0.5)]' : ''
                      }`}>
                        {lines[activeIndex] || '—'}
                      </p>
                    </div>

                    {/* Next line preview */}
                    {activeIndex >= 0 && activeIndex < totalCount - 1 && (
                      <p className="text-[14px] text-white/20 mt-6 text-center max-w-lg leading-relaxed">
                        {lines[activeIndex + 1]}
                      </p>
                    )}

                    {/* Current timestamp */}
                    <div className="mt-8 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                      <span className="text-[13px] font-mono text-[--accent]">
                        {formatTime(currentTime)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Synchronisation terminée !</h3>
                    <p className="text-[14px] text-white/40 mb-6">
                      Toutes les {totalCount} lignes ont été synchronisées.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={goToReview}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-500/20 text-green-400 font-medium text-[13px] border border-green-500/30 hover:bg-green-500/30 transition-all"
                      >
                        Voir l&apos;aperçu
                      </button>
                      <button
                        onClick={restartSync}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] text-white/50 font-medium text-[13px] border border-white/[0.08] hover:bg-white/[0.1] transition-all"
                      >
                        Recommencer
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Control buttons (Musixmatch-style) ── */}
              <div className="px-6 py-4 border-t border-white/[0.08] bg-white/[0.02]">
                {/* Main TAP TO SYNC button */}
                {!allSynced && (
                  <button
                    onClick={handleTapSync}
                    className={`
                      sync-btn w-full py-4 rounded-2xl text-white font-bold text-[16px] tracking-wide
                      flex items-center justify-center gap-3 transition-all duration-200 mb-3
                      ${glowActive
                        ? 'bg-[--accent] shadow-[0_0_40px_rgba(108,92,231,0.6)] scale-[0.97]'
                        : 'bg-gradient-to-r from-[--accent] to-[#4fa4e0] hover:shadow-[0_0_25px_rgba(108,92,231,0.35)] hover:scale-[1.01]'
                      }
                    `}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
                    </svg>
                    SYNCHRONISER
                    <span className="text-[11px] font-normal text-white/50 ml-1">
                      Espace
                    </span>
                  </button>
                )}

                {/* Secondary controls row */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUndo}
                    disabled={history.length === 0}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.06] text-white/50 text-[13px] font-medium border border-white/[0.08] hover:bg-white/[0.1] hover:text-white/70 transition-all disabled:opacity-25 disabled:pointer-events-none"
                    title="Ctrl+Z / Retour arrière"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                    </svg>
                    Annuler
                  </button>
                  <button
                    onClick={restartSync}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.06] text-white/50 text-[13px] font-medium border border-white/[0.08] hover:bg-white/[0.1] hover:text-white/70 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                    </svg>
                    Recommencer
                  </button>
                  <button
                    onClick={goBackToLyrics}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.06] text-white/50 text-[13px] font-medium border border-white/[0.08] hover:bg-white/[0.1] hover:text-white/70 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                    Modifier
                  </button>
                </div>

                {/* Keyboard shortcuts hint */}
                <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-white/20">
                  <span><kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white/40 font-mono">Espace</kbd> Sync</span>
                  <span><kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white/40 font-mono">⌫</kbd> Annuler</span>
                  <span><kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white/40 font-mono mr-0.5">←</kbd><kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white/40 font-mono">→</kbd> ±5s</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Line list sidebar */}
            <div className="flex flex-col bg-white/[0.02]">
              <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
                <h4 className="text-[12px] font-semibold text-white/50 uppercase tracking-wider">Toutes les lignes</h4>
                {allSynced && (
                  <button
                    onClick={goToReview}
                    className="text-[11px] text-green-400 font-medium hover:text-green-300 transition-colors"
                  >
                    Sauvegarder →
                  </button>
                )}
              </div>
              <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2" style={{ maxHeight: '420px' }}>
                {lines.map((line, index) => {
                  const synced = timestamps[index] > 0;
                  const active = index === activeIndex;
                  const isSelected = index === selectedLineIndex;
                  return (
                    <div key={index}>
                      <div
                        ref={(el) => { lineRefs.current[index] = el; }}
                        onClick={() => setSelectedLineIndex(isSelected ? null : index)}
                        className={`
                          flex items-center gap-2.5 py-2 px-3 mb-0.5 rounded-xl cursor-pointer transition-all duration-200
                          ${active && !synced
                            ? 'bg-[--accent]/15 border border-[--accent]/30 shadow-sm'
                            : synced
                              ? 'bg-green-500/5 border border-transparent hover:bg-green-500/10'
                              : 'border border-transparent hover:bg-white/[0.04]'
                          }
                        `}
                      >
                        {/* Line number */}
                        <span className={`text-[10px] font-mono w-5 text-right flex-shrink-0 ${
                          active && !synced ? 'text-[--accent]' : synced ? 'text-green-400/50' : 'text-white/15'
                        }`}>
                          {index + 1}
                        </span>

                        {/* Status dot */}
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          active && !synced ? 'bg-[--accent] animate-pulse' : synced ? 'bg-green-400' : 'bg-white/15'
                        }`} />

                        {/* Timestamp */}
                        <span className={`text-[10px] font-mono w-14 flex-shrink-0 ${
                          synced ? 'text-green-400/60' : 'text-white/15'
                        }`}>
                          {synced ? formatTime(timestamps[index]) : '--:--.--'}
                        </span>

                        {/* Lyric text */}
                        <span className={`text-[12px] truncate flex-1 min-w-0 ${
                          active && !synced ? 'text-white font-medium' : synced ? 'text-white/45' : 'text-white/25'
                        }`}>
                          {line}
                        </span>

                        {synced && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleClearLine(index); }}
                            className="w-5 h-5 rounded-md bg-white/[0.06] text-white/35 hover:text-white/75 hover:bg-white/[0.14] transition-colors flex items-center justify-center"
                            title="Supprimer la synchronisation de cette ligne"
                            aria-label={`Supprimer la synchronisation de la ligne ${index + 1}`}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Expanded controls for selected line */}
                      {isSelected && synced && (
                        <div className="ml-8 mr-2 mb-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); adjustTiming(index, -0.1); }}
                            className="px-2 py-1 rounded-md bg-white/[0.06] text-[10px] font-mono text-white/50 hover:bg-white/[0.12] hover:text-white/80 transition-all"
                            title="Reculer de 0.1s"
                          >
                            -0.1s
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); adjustTiming(index, +0.1); }}
                            className="px-2 py-1 rounded-md bg-white/[0.06] text-[10px] font-mono text-white/50 hover:bg-white/[0.12] hover:text-white/80 transition-all"
                            title="Avancer de 0.1s"
                          >
                            +0.1s
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleResyncLine(index); }}
                            className="px-2 py-1 rounded-md bg-[--accent]/15 text-[10px] text-[--accent] font-medium hover:bg-[--accent]/25 transition-all"
                            title="Re-synchroniser à la position actuelle"
                          >
                            Re-sync
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleClearLine(index); }}
                            className="px-2 py-1 rounded-md bg-red-500/10 text-[10px] text-red-400 hover:bg-red-500/20 transition-all"
                            title="Effacer le timing"
                          >
                            Effacer
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ STEP 4: Review ═══ */}
      {step === 'review' && (
        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-white mb-1">Aperçu de la synchronisation</h3>
            <p className="text-[13px] text-white/40">
              Vérifiez le résultat avant de sauvegarder. Vous pouvez retourner modifier si nécessaire.
            </p>
          </div>

          {/* Preview list */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden mb-6 max-h-[400px] overflow-y-auto">
            {lines.map((line, index) => (
              <div
                key={index}
                className={`flex items-center gap-4 px-5 py-3 border-b border-white/[0.04] last:border-b-0 ${
                  timestamps[index] === 0 ? 'bg-red-500/5' : ''
                }`}
              >
                <span className="text-[10px] font-mono text-white/20 w-5 text-right">
                  {index + 1}
                </span>
                <span className={`text-[12px] font-mono w-20 flex-shrink-0 ${
                  timestamps[index] > 0 ? 'text-[--accent]/70' : 'text-red-400/60'
                }`}>
                  [{formatTime(timestamps[index])}]
                </span>
                <span className="text-[14px] text-white/70">{line}</span>
              </div>
            ))}
          </div>

          {/* LRC preview */}
          <details className="mb-6">
            <summary className="text-[12px] text-white/30 cursor-pointer hover:text-white/50 transition-colors mb-2">
              Voir le code LRC brut
            </summary>
            <pre className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-[11px] text-white/30 font-mono overflow-x-auto leading-relaxed max-h-48">
              {generateLrc(lines.map((line, index) => ({ time: timestamps[index] || 0, text: line })))}
            </pre>
          </details>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={saveLrc}
              disabled={timestamps.some((t) => t === 0)}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-green-500/90 text-white font-semibold text-[14px] hover:bg-green-500 active:scale-[0.97] transition-all disabled:opacity-30 disabled:pointer-events-none shadow-lg shadow-green-500/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Sauvegarder le LRC
            </button>
            <button
              onClick={goBackToSync}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/[0.06] text-white/50 font-medium text-[14px] border border-white/[0.08] hover:bg-white/[0.1] hover:text-white/70 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Retour à la synchro
            </button>
            <button
              onClick={onCancel}
              className="px-5 py-3 rounded-2xl bg-white/[0.06] text-white/50 font-medium text-[14px] border border-white/[0.08] hover:bg-white/[0.1] hover:text-white/70 transition-all"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
