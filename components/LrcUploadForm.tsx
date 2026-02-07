'use client';

import { useEffect, useState } from 'react';
import { extractPlainLyrics, parseLrc, type SyncedLine } from '@/utils/lrcParser';
import LyricPlayer from '@/components/LyricPlayer';
import { createLrcFile, createSong, getCurrentUserId } from '@/lib/supabaseData';

export default function LrcUploadForm() {
  const [lrcText, setLrcText] = useState('');
  const [parsed, setParsed] = useState<SyncedLine[]>([]);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    getCurrentUserId().then(setUserId);
  }, []);

  const handleLrcFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.lrc')) {
      setError('Veuillez sélectionner un fichier .lrc');
      return;
    }
    const text = await file.text();
    setLrcText(text);
    setError('');
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.lrc')) {
      setError('Veuillez déposer un fichier .lrc');
      return;
    }
    const text = await file.text();
    setLrcText(text);
    setError('');
  };

  const handleParse = () => {
    const result = parseLrc(lrcText);
    if (!result.length) {
      setError('Aucune ligne synchronisée détectée. Vérifiez le format du fichier LRC.');
      setParsed([]);
      return;
    }
    setParsed(result);
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!title.trim() || !artist.trim()) {
      setError('Veuillez renseigner le titre et l\'artiste.');
      return;
    }
    const parsedResult = parsed.length ? parsed : parseLrc(lrcText);
    if (!parsedResult.length) {
      setError('Veuillez parser un fichier LRC valide avant de sauvegarder.');
      setParsed([]);
      return;
    }
    if (!parsed.length) setParsed(parsedResult);
    setSaving(true);
    setError('');
    setSuccess('');

    const lyricsPlain = extractPlainLyrics(lrcText);
    const { data: song, error: songError } = await createSong({
      title: title.trim(),
      artist_name: artist.trim(),
      lyrics_text: lyricsPlain,
      created_by: userId,
      submitted_by: userId,
    });

    if (songError || !song) {
      setSaving(false);
      setError(songError?.message || 'Erreur lors de la création de la chanson.');
      return;
    }

    const { error: lrcError } = await createLrcFile({
      song_id: song.id,
      synced_lyrics: parsedResult,
      lrc_raw: lrcText,
      source: 'manual',
      created_by: userId,
    });

    if (lrcError) {
      setSaving(false);
      setError(lrcError.message);
      return;
    }

    setSaving(false);
    setSuccess('Sauvegardé avec succès dans la base de données.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[22px] font-bold text-[--text-primary] tracking-tight">
          Importer un fichier LRC
        </h2>
        <p className="text-[14px] text-[--text-secondary] mt-1">
          Chargez un fichier .lrc synchronisé pour l&#39;ajouter à la bibliothèque
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="px-4 py-3 rounded-[12px] bg-red-50 border border-red-200/60 text-[13px] text-red-600 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-[12px] bg-green-50 border border-green-200/60 text-[13px] text-green-600 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      {/* Song info card */}
      <div className="card-apple p-6">
        <h3 className="text-[14px] font-semibold text-[--text-primary] mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-[--text-tertiary]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          Informations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-medium text-[--text-tertiary] mb-1.5 uppercase tracking-wider">
              Titre *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-apple w-full"
              placeholder="Ex: Amazing Grace"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[--text-tertiary] mb-1.5 uppercase tracking-wider">
              Artiste *
            </label>
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="input-apple w-full"
              placeholder="Ex: Traditional"
            />
          </div>
        </div>
      </div>

      {/* File upload card */}
      <div className="card-apple p-6">
        <h3 className="text-[14px] font-semibold text-[--text-primary] mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-[--text-tertiary]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          Fichier LRC
        </h3>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-[14px] p-8 text-center transition-all ${
            dragOver
              ? 'border-[--accent] bg-[--accent]/5'
              : 'border-black/[0.08] hover:border-black/[0.15] bg-black/[0.01]'
          }`}
        >
          <input
            type="file"
            accept=".lrc"
            onChange={handleLrcFile}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="w-10 h-10 rounded-full bg-[--accent]/10 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-[--accent]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="text-[13px] text-[--text-secondary]">
            Glissez un fichier .lrc ici ou <span className="text-[--accent] font-medium">parcourir</span>
          </p>
          <p className="text-[11px] text-[--text-tertiary] mt-1">Format LRC uniquement</p>
        </div>

        {/* Textarea */}
        <div className="mt-4">
          <label className="block text-[12px] font-medium text-[--text-tertiary] mb-1.5 uppercase tracking-wider">
            Ou collez le contenu LRC
          </label>
          <textarea
            value={lrcText}
            onChange={(e) => setLrcText(e.target.value)}
            placeholder="[00:00.00] Première ligne..."
            rows={8}
            className="input-apple w-full resize-none font-mono text-[13px] leading-relaxed"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={handleParse}
            disabled={!lrcText.trim()}
            className="btn-primary text-[13px] py-2.5 px-5 disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            Parser &amp; Prévisualiser
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !lrcText.trim()}
            className="btn-secondary text-[13px] py-2.5 px-5 disabled:opacity-30"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-[--accent]/30 border-t-[--accent] rounded-full animate-spin" />
                Sauvegarde...
              </span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
                Sauvegarder
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview */}
      {parsed.length > 0 && (
        <div className="animate-fade-in-up">
          <h3 className="text-[14px] font-semibold text-[--text-primary] mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-[--text-tertiary]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
            Prévisualisation — {parsed.length} lignes
          </h3>
          <LyricPlayer syncedLyrics={parsed} lrcRaw={lrcText} />
        </div>
      )}
    </div>
  );
}
