'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import LyricEditor from '@/components/LyricEditor';
import type { SyncedLine } from '@/utils/lrcParser';
import { createLrcFile, createSong, getCurrentUserId } from '@/lib/supabaseData';

export default function SyncPage() {
  return (
    <AuthGuard>
      <SyncPageContent />
    </AuthGuard>
  );
}

function SyncPageContent() {
  const router = useRouter();
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
    setSuccess('Sauvegardé avec succès ! Redirection...');
    setTimeout(() => router.push(`/songs/${song.id}`), 1500);
  };

  return (
    <div className="min-h-screen bg-[#0d0d12] pt-[52px]">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/70 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Retour
          </Link>
        </div>

        {/* Song info card */}
        <div className="rounded-[20px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] p-6 mb-6">
          <h2 className="text-[15px] font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            Informations de la chanson
          </h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-[12px] bg-red-500/10 border border-red-500/20 text-[13px] text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 px-4 py-3 rounded-[12px] bg-green-500/10 border border-green-500/20 text-[13px] text-green-400">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">
                Titre *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-[10px] px-4 py-2.5 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-[--accent]/40 transition-colors"
                placeholder="Nom de la chanson"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">
                Artiste *
              </label>
              <input
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-[10px] px-4 py-2.5 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-[--accent]/40 transition-colors"
                placeholder="Nom de l'artiste"
              />
            </div>
          </div>
        </div>

        {/* Editor */}
        <LyricEditor onSave={handleSave} onCancel={() => setSavedLrc(null)} />

        {/* Generated LRC output */}
        {savedLrc && (
          <div className="mt-6 rounded-[20px] bg-white/[0.04] border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[15px] font-semibold text-white">LRC généré</h3>
                <p className="text-[12px] text-white/30 mt-0.5">
                  {savedLines.length} lignes synchronisées
                </p>
              </div>
              <button
                onClick={handleSaveSupabase}
                disabled={saving}
                className="btn-primary text-[13px] py-2.5 px-5 disabled:opacity-30"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sauvegarde...
                  </>
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

            <pre className="bg-white/[0.03] border border-white/[0.04] rounded-[12px] p-4 text-[12px] text-white/40 font-mono overflow-x-auto leading-relaxed max-h-48">
              {savedLrc}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
