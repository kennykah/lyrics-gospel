'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LyricEditor from '@/components/LyricEditor';
import type { SyncedLine } from '@/utils/lrcParser';
import { createLrcFile, createSong, getCurrentUserId } from '@/lib/supabaseData';

export default function SyncPage() {
  const [savedLrc, setSavedLrc] = useState<string | null>(null);
  const [savedLines, setSavedLines] = useState<SyncedLine[]>([]);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUserId().then(setUserId);
  }, []);

  const handleSave = (lrcContent: string, synced: SyncedLine[]) => {
    setSavedLrc(lrcContent);
    setSavedLines(synced);
    setSuccess('');
    setError('');
  };

  const handleSaveSupabase = async () => {
    if (!title.trim() || !artist.trim()) {
      setError('Veuillez renseigner le titre et l\'artiste.');
      return;
    }
    if (!savedLrc || !savedLines.length) {
      setError('Veuillez créer une synchronisation avant de sauvegarder.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');

    const { data: song, error: songError } = await createSong({
      title: title.trim(),
      artist_name: artist.trim(),
      lyrics_text: savedLines.map((l) => l.text).join('\n'),
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
      synced_lyrics: savedLines,
      lrc_raw: savedLrc,
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-6">
          <Link href="/" className="text-sm text-purple-700 hover:text-purple-800">
            ← Retour à l&apos;accueil
          </Link>
        </div>
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Informations de la chanson</h2>

            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
            )}
            {success && (
              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">{success}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Artiste *</label>
                <input
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          <LyricEditor onSave={handleSave} onCancel={() => setSavedLrc(null)} />

          {savedLrc && (
            <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-2">LRC généré</h3>
              <p className="text-sm text-gray-600 mb-4">Copiez ce contenu pour l&apos;utiliser ailleurs.</p>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">{savedLrc}</pre>
              <div className="mt-4 text-sm text-gray-500">Lignes synchronisées: {savedLines.length}</div>
              <button
                onClick={handleSaveSupabase}
                disabled={saving}
                className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Sauvegarde...' : 'Sauvegarder dans Supabase'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
