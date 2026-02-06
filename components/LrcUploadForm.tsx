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
    setSuccess('Sauvegardé dans Supabase.');
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold mb-2">Importer un fichier LRC</h2>
      <p className="text-gray-600 mb-6">
        Chargez un fichier .lrc et un audio local (temporaire) pour prévisualiser la synchronisation.
      </p>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Ex: Amazing Grace"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Artiste *</label>
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Ex: Traditional"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fichier LRC</label>
          <input
            type="file"
            accept=".lrc"
            onChange={handleLrcFile}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contenu LRC</label>
          <textarea
            value={lrcText}
            onChange={(e) => setLrcText(e.target.value)}
            placeholder="Collez votre contenu LRC ici..."
            rows={8}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <button
          onClick={handleParse}
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Parser & Prévisualiser
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder dans Supabase'}
        </button>
      </div>

      {parsed.length > 0 && (
        <div className="mt-8">
          <LyricPlayer syncedLyrics={parsed} lrcRaw={lrcText} />
        </div>
      )}
    </div>
  );
}
