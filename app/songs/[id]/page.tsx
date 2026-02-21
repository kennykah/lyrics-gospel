'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { deleteSongById, fetchLrcBySongId, fetchSongById, fetchRelatedSongs, fetchUserRole, saveSongLrcCorrection, trackSongPlay, trackSongVisit, updateSongMetadata } from '@/lib/supabaseData';
import { isSupabaseAudioStorageEnabled, tryFindSongAudioUrlInStorage } from '@/lib/audioStorage';
import type { Song, LrcFile } from '@/types';
import AppleLyricPlayer from '@/components/AppleLyricPlayer';
import { slugifyArtistName } from '@/utils/artistSlug';
import { extractPlainLyrics, generateLrc, parseLrc } from '@/utils/lrcParser';

function isLikelyDirectAudioUrl(url?: string | null) {
  if (!url) return false;
  if (url.startsWith('local://')) return false;
  if (!/^https?:\/\//i.test(url)) return false;
  return /(\.mp3|\.wav|\.m4a|\.ogg|\.flac|\.aac|\.webm)(\?|$)/i.test(url);
}

export default function SongDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const songId = params?.id as string;
  const [song, setSong] = useState<Song | null>(null);
  const [lrc, setLrc] = useState<LrcFile | null>(null);
  const [related, setRelated] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lyrics' | 'message'>('lyrics');
  const [copied, setCopied] = useState(false);
  const [lyricsCopied, setLyricsCopied] = useState(false);
  const [lrcDownloaded, setLrcDownloaded] = useState(false);
  const [isEditingLrc, setIsEditingLrc] = useState(false);
  const [lrcDraft, setLrcDraft] = useState('');
  const [savingLrc, setSavingLrc] = useState(false);
  const [lrcEditMessage, setLrcEditMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [deletingSong, setDeletingSong] = useState(false);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [metadataTitle, setMetadataTitle] = useState('');
  const [metadataArtist, setMetadataArtist] = useState('');
  const [metadataCollaborations, setMetadataCollaborations] = useState('');
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [metadataMessage, setMetadataMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!songId || typeof window === 'undefined') return;
    const visitKey = `song-visit-tracked:${songId}`;
    if (window.sessionStorage.getItem(visitKey)) return;
    window.sessionStorage.setItem(visitKey, '1');
    void trackSongVisit(songId);
  }, [songId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Parallel fetch for performance
      const [songRes, lrcRes] = await Promise.all([
        fetchSongById(songId),
        fetchLrcBySongId(songId),
      ]);
      const songData = songRes.data as Song;

      let resolvedSong = songData;
      const hasPersistentAudio = isLikelyDirectAudioUrl(songData?.audio_url);
      if (songData && !hasPersistentAudio && isSupabaseAudioStorageEnabled()) {
        const fallbackAudioUrl = await tryFindSongAudioUrlInStorage({
          title: songData.title,
          artist: songData.artist_name,
          slug: songData.slug,
        });
        if (fallbackAudioUrl) {
          resolvedSong = { ...songData, audio_url: fallbackAudioUrl };
        }
      }

      setSong(resolvedSong);
      setLrc(lrcRes.data as LrcFile);

      // Fetch related after we have artist name
      if (resolvedSong) {
        const relRes = await fetchRelatedSongs(songId, resolvedSong.artist_name, 4);
        setRelated((relRes.data as Song[]) || []);
      }

      const role = await fetchUserRole();
      setUserRole(role);
      setLoading(false);
    };
    if (songId) load();
  }, [songId]);

  const syncedLyrics = useMemo(() => lrc?.synced_lyrics || [], [lrc]);
  const artistDisplay = useMemo(() => {
    if (!song) return '';
    const collabs = song.collaborations?.trim();
    return collabs ? `${song.artist_name} feat. ${collabs}` : song.artist_name;
  }, [song]);

  const plainLyrics = useMemo(() => {
    if (syncedLyrics.length > 0) {
      return syncedLyrics
        .map((line) => line.text?.trim())
        .filter(Boolean)
        .join('\n');
    }
    if (song?.lyrics_text?.trim()) return song.lyrics_text.trim();
    if (lrc?.lrc_raw?.trim()) return extractPlainLyrics(lrc.lrc_raw);
    return '';
  }, [syncedLyrics, song, lrc]);

  const handleShare = async () => {
    const url = window.location.href;
    const title = song ? `${song.title} — ${song.artist_name}` : 'Gospel Lyrics';
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadLrc = () => {
    if (!song || syncedLyrics.length === 0) return;

    const lrcContent = lrc?.lrc_raw?.trim()
      ? lrc.lrc_raw
      : generateLrc(syncedLyrics, { title: song.title, artist: song.artist_name });

    const fileName = `${slugifyArtistName(song.artist_name)}-${slugifyArtistName(song.title)}.lrc`;
    const blob = new Blob([lrcContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setLrcDownloaded(true);
    setTimeout(() => setLrcDownloaded(false), 2000);
  };

  const handleCopyPlainLyrics = async () => {
    if (!plainLyrics) return;
    await navigator.clipboard.writeText(plainLyrics);
    setLyricsCopied(true);
    setTimeout(() => setLyricsCopied(false), 2000);
  };

  const handleShareOnWhatsApp = () => {
    if (!song || !plainLyrics) return;

    const preview = plainLyrics.length > 2800
      ? `${plainLyrics.slice(0, 2800)}...`
      : plainLyrics;
    const message = `🎵 ${song.title} — ${song.artist_name}\n\n${preview}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleStartLrcEdit = () => {
    if (!song || syncedLyrics.length === 0 || userRole !== 'admin') return;

    const initialLrc = lrc?.lrc_raw?.trim()
      ? lrc.lrc_raw
      : generateLrc(syncedLyrics, { title: song.title, artist: song.artist_name });

    setLrcDraft(initialLrc);
    setLrcEditMessage(null);
    setIsEditingLrc(true);
  };

  const handleCancelLrcEdit = () => {
    setIsEditingLrc(false);
    setLrcEditMessage(null);
  };

  const handleSaveLrcCorrection = async () => {
    if (!song || userRole !== 'admin') return;
    const nextRaw = lrcDraft.trim();
    const parsed = parseLrc(nextRaw);

    if (parsed.length === 0) {
      setLrcEditMessage({
        type: 'error',
        text: 'Format LRC invalide. Les timestamps doivent rester au format [mm:ss.xx].',
      });
      return;
    }

    const plain = parsed
      .map((line) => line.text?.trim())
      .filter(Boolean)
      .join('\n');

    setSavingLrc(true);
    setLrcEditMessage(null);

    const { error } = await saveSongLrcCorrection({
      songId,
      lrcRaw: nextRaw,
      syncedLyrics: parsed,
      plainLyrics: plain,
    });

    if (error) {
      setLrcEditMessage({
        type: 'error',
        text: 'Impossible d’enregistrer la correction. Vérifie tes droits de contribution.',
      });
      setSavingLrc(false);
      return;
    }

    setLrc((prev) => ({
      id: prev?.id ?? `song-${songId}-lrc`,
      song_id: songId,
      synced_lyrics: parsed,
      lrc_raw: nextRaw,
      source: 'manual',
      quality_score: prev?.quality_score,
      validated_by: prev?.validated_by,
      validated_at: prev?.validated_at,
    }));
    setSong((prev) => (prev ? { ...prev, lyrics_text: plain } : prev));
    setLrcEditMessage({ type: 'success', text: 'Correction enregistrée avec succès.' });
    setSavingLrc(false);
    setIsEditingLrc(false);
  };

  const handleDeleteSong = async () => {
    if (!song || userRole !== 'admin') return;
    const confirmed = window.confirm(`Supprimer la chanson "${song.title}" ? Cette action est irréversible.`);
    if (!confirmed) return;

    setDeletingSong(true);
    const { error } = await deleteSongById(song.id);
    if (error) {
      setLrcEditMessage({ type: 'error', text: error.message || 'Suppression impossible.' });
      setDeletingSong(false);
      return;
    }

    router.push('/songs');
  };

  const handleStartMetadataEdit = () => {
    if (!song || userRole !== 'admin') return;
    setMetadataTitle(song.title || '');
    setMetadataArtist(song.artist_name || '');
    setMetadataCollaborations(song.collaborations || '');
    setMetadataMessage(null);
    setIsEditingMetadata(true);
  };

  const handleCancelMetadataEdit = () => {
    setIsEditingMetadata(false);
    setMetadataMessage(null);
  };

  const handleSaveMetadata = async () => {
    if (!song || userRole !== 'admin') return;

    if (!metadataTitle.trim() || !metadataArtist.trim()) {
      setMetadataMessage({
        type: 'error',
        text: 'Le titre et l’artiste principal sont obligatoires.',
      });
      return;
    }

    setSavingMetadata(true);
    setMetadataMessage(null);

    const { data, error } = await updateSongMetadata({
      songId: song.id,
      title: metadataTitle,
      artist_name: metadataArtist,
      collaborations: metadataCollaborations,
    });

    if (error || !data) {
      setMetadataMessage({
        type: 'error',
        text: error?.message || 'Impossible de mettre à jour les informations du son.',
      });
      setSavingMetadata(false);
      return;
    }

    setSong((prev) => (prev ? { ...prev, ...(data as Song) } : prev));
    setMetadataMessage({ type: 'success', text: 'Informations du son mises à jour.' });
    setSavingMetadata(false);
    setIsEditingMetadata(false);
  };

  const statusLabel: Record<string, string> = {
    published: 'Publié',
    draft: 'Brouillon',
    archived: 'Archivé',
    submitted: 'Soumis',
    approved: 'Approuvé',
    rejected: 'Rejeté',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d12] pt-[52px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          <p className="text-white/40 text-[13px]">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen bg-[#0d0d12] pt-[52px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/[0.06] flex items-center justify-center">
            <svg className="w-7 h-7 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
            </svg>
          </div>
          <p className="text-white/50 text-[15px]">Chanson introuvable.</p>
          <Link href="/songs" className="mt-4 inline-block text-[13px] text-[--accent] hover:underline">
            Retour aux chansons
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d12] text-white">
      {/* Immersive background — blurred album color */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0533] via-[#0d0d12] to-[#0a1628]" />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 pt-[52px]">
        {/* Top bar */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/songs" className="inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/70 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Retour
          </Link>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[12px] text-white/50 hover:bg-white/[0.1] hover:text-white/70 transition-all"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Lien copié !
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
                Partager
              </>
            )}
          </button>
        </div>

        {/* Main layout — iPad-style split */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

            {/* ═══ LEFT: Player + Lyrics ═══ */}
            <div className="space-y-6">
              {/* Song info header */}
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-[18px] bg-gradient-to-br from-purple-500/40 to-pink-500/30 backdrop-blur-sm flex items-center justify-center border border-white/[0.08] shadow-xl">
                  <svg className="w-8 h-8 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-[-0.02em]">{song.title}</h1>
                  <p className="text-white/50 text-[15px]">{artistDisplay}</p>
                  {song.album && (
                    <p className="text-white/30 text-[13px] mt-0.5">{song.album}{song.release_year ? ` \u00B7 ${song.release_year}` : ''}</p>
                  )}
                </div>
              </div>

              {syncedLyrics.length > 0 ? (
                <AppleLyricPlayer
                  syncedLyrics={syncedLyrics}
                  lrcRaw={lrc?.lrc_raw}
                  audioUrl={song.audio_url}
                  onFirstPlay={() => {
                    void trackSongPlay(song.id);
                  }}
                />
              ) : (
                <div className="rounded-[20px] bg-white/[0.04] border border-white/[0.06] p-12 text-center">
                  <p className="text-white/40 text-[15px] mb-2">Aucun LRC synchronisé pour cette chanson.</p>
                  <p className="text-white/25 text-[13px] mb-4">Soyez le premier à synchroniser les paroles !</p>
                  <Link href="/sync" className="inline-block btn-primary text-[13px] py-2.5 px-5">
                    Synchroniser les paroles
                  </Link>
                </div>
              )}

              {/* Plain lyrics fallback */}
              {!syncedLyrics.length && song.lyrics_text && (
                <div className="rounded-[20px] bg-white/[0.04] border border-white/[0.06] p-6">
                  <h3 className="text-[13px] font-medium text-white/30 uppercase tracking-wider mb-4">Paroles</h3>
                  <pre className="text-[15px] text-white/60 leading-relaxed whitespace-pre-wrap font-sans">
                    {song.lyrics_text}
                  </pre>
                </div>
              )}
            </div>

            {/* ═══ RIGHT: Sidebar ═══ */}
            <aside className="lg:sticky lg:top-[76px] lg:self-start space-y-4">
              {/* Tab switcher */}
              <div className="flex gap-1 p-1 rounded-[12px] bg-white/[0.06]" role="tablist">
                <button
                  role="tab"
                  aria-selected={activeTab === 'lyrics'}
                  onClick={() => setActiveTab('lyrics')}
                  className={`flex-1 py-2 text-[13px] font-medium rounded-[10px] transition-all duration-200 ${
                    activeTab === 'lyrics'
                      ? 'bg-white/[0.12] text-white shadow-sm'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  Infos
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === 'message'}
                  onClick={() => setActiveTab('message')}
                  className={`flex-1 py-2 text-[13px] font-medium rounded-[10px] transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    activeTab === 'message'
                      ? 'bg-white/[0.12] text-white shadow-sm'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                  Le Message
                </button>
              </div>

              {activeTab === 'lyrics' ? (
                /* ── Song details panel ── */
                <div className="rounded-[20px] bg-white/[0.04] border border-white/[0.06] p-4 sm:p-6 space-y-5" role="tabpanel">
                  <div>
                    <h3 className="text-[11px] font-medium uppercase tracking-wider text-white/30 mb-3">Détails</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-[14px]">
                        <span className="text-white/40">Artiste</span>
                        <Link href={`/artists/${slugifyArtistName(song.artist_name)}`} className="text-white/80 font-medium hover:text-[--accent] transition-colors">
                          {song.artist_name}
                        </Link>
                      </div>
                      {song.collaborations?.trim() && (
                        <div className="flex justify-between text-[14px] gap-6">
                          <span className="text-white/40">Collaborations</span>
                          <span className="text-white/80 font-medium text-right">{song.collaborations}</span>
                        </div>
                      )}
                      {song.album && (
                        <div className="flex justify-between text-[14px]">
                          <span className="text-white/40">Album</span>
                          <span className="text-white/80 font-medium">{song.album}</span>
                        </div>
                      )}
                      {song.release_year && (
                        <div className="flex justify-between text-[14px]">
                          <span className="text-white/40">Année</span>
                          <span className="text-white/80 font-medium">{song.release_year}</span>
                        </div>
                      )}
                      {song.genre && (
                        <div className="flex justify-between text-[14px]">
                          <span className="text-white/40">Genre</span>
                          <span className="text-white/80 font-medium">{song.genre}</span>
                        </div>
                      )}
                      {song.category && (
                        <div className="flex justify-between text-[14px]">
                          <span className="text-white/40">Catégorie</span>
                          <span className="text-white/80 font-medium">{song.category}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[14px]">
                        <span className="text-white/40">Statut</span>
                        <span className={`font-medium px-2 py-0.5 rounded-full text-[12px] ${
                          song.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-white/[0.08] text-white/50'
                        }`}>
                          {statusLabel[song.status] || song.status}
                        </span>
                      </div>
                      {syncedLyrics.length > 0 && (
                        <div className="flex justify-between text-[14px]">
                          <span className="text-white/40">Lignes sync.</span>
                          <span className="text-white/80 font-medium">{syncedLyrics.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* ── "Le Message" panel ── */
                <div className="rounded-[20px] bg-white/[0.04] border border-white/[0.06] overflow-hidden" role="tabpanel">
                  <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#4fa4e0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                    </svg>
                    <span className="text-[15px] font-semibold text-white">Le Message</span>
                  </div>

                  <div className="p-6 space-y-6">
                    <div>
                      <h4 className="text-[11px] font-medium uppercase tracking-wider text-white/30 mb-3">
                        L&apos;histoire derrière la chanson
                      </h4>
                      <div className="rounded-[14px] bg-white/[0.04] p-4">
                        <p className="text-[14px] text-white/60 leading-relaxed">
                          Ce chant a été écrit lors d&apos;une retraite spirituelle.
                          L&apos;auteur raconte comment il a été inspiré par l&apos;image
                          de Pierre marchant sur l&apos;eau, non pas comme un miracle
                          lointain, mais comme une métaphore de la confiance quotidienne.
                        </p>
                        <p className="text-[14px] text-white/60 leading-relaxed mt-3">
                          Cette chanson nous invite à sortir de notre zone de confort
                          pour trouver Dieu dans l&apos;inconnu.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[11px] font-medium uppercase tracking-wider text-white/30 mb-3">
                        Versets associés
                      </h4>
                      <div className="space-y-3">
                        <div className="rounded-[14px] bg-white/[0.04] p-4 border-l-2 border-[#4fa4e0]">
                          <p className="text-[14px] text-white/70 leading-relaxed italic">
                            &ldquo;Il dit: Viens! Pierre sortit de la barque, et
                            marcha sur les eaux, pour aller vers Jésus.&rdquo;
                          </p>
                          <p className="text-[13px] text-[#4fa4e0] font-medium mt-2">Matthieu 14:29</p>
                        </div>
                        <div className="rounded-[14px] bg-white/[0.04] p-4 border-l-2 border-[#a78bfa]">
                          <p className="text-[14px] text-white/70 leading-relaxed italic">
                            &ldquo;Car je suis l&apos;Éternel, ton Dieu, Qui fortifie ta
                            droite, Qui te dis: Ne crains rien, Je viens à ton
                            secours.&rdquo;
                          </p>
                          <p className="text-[13px] text-[#a78bfa] font-medium mt-2">Ésaïe 41:13</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[11px] font-medium uppercase tracking-wider text-white/30 mb-3">
                        Note personnelle
                      </h4>
                      <div className="rounded-[14px] bg-white/[0.04] p-4">
                        <p className="text-[14px] text-white/40 italic leading-relaxed">
                          Ajoutez votre propre réflexion sur ce chant...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-[20px] bg-white/[0.04] border border-white/[0.06] p-4 sm:p-5">
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-white/30 mb-3">Actions paroles</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={handleDownloadLrc}
                    disabled={syncedLyrics.length === 0}
                    className="h-10 px-3 rounded-[10px] bg-white/[0.08] hover:bg-white/[0.14] disabled:opacity-40 disabled:cursor-not-allowed text-[12px] font-medium text-white/70 transition-colors"
                  >
                    {lrcDownloaded ? 'LRC téléchargé' : 'Télécharger le LRC'}
                  </button>

                  <button
                    onClick={handleCopyPlainLyrics}
                    disabled={!plainLyrics}
                    className="h-10 px-3 rounded-[10px] bg-white/[0.08] hover:bg-white/[0.14] disabled:opacity-40 disabled:cursor-not-allowed text-[12px] font-medium text-white/70 transition-colors"
                  >
                    {lyricsCopied ? 'Paroles copiées' : 'Copier les paroles'}
                  </button>

                  <button
                    onClick={handleShareOnWhatsApp}
                    disabled={!plainLyrics}
                    className="h-10 px-3 rounded-[10px] bg-[--accent] hover:bg-[--accent-hover] disabled:opacity-40 disabled:cursor-not-allowed text-[12px] font-semibold text-white transition-colors sm:col-span-2"
                  >
                    Partager les paroles sur WhatsApp
                  </button>

                  {userRole === 'admin' && (
                    <>
                      <button
                        onClick={handleStartLrcEdit}
                        disabled={syncedLyrics.length === 0}
                        className="h-10 px-3 rounded-[10px] bg-white/[0.08] hover:bg-white/[0.14] disabled:opacity-40 disabled:cursor-not-allowed text-[12px] font-medium text-white/70 transition-colors sm:col-span-2"
                      >
                        Corriger l’orthographe du LRC
                      </button>
                      <Link
                        href={`/sync?songId=${song.id}`}
                        className="h-10 px-3 rounded-[10px] bg-white/[0.08] hover:bg-white/[0.14] text-[12px] font-medium text-white/70 transition-colors inline-flex items-center justify-center sm:col-span-2"
                      >
                        Modifier la synchronisation
                      </Link>
                      <button
                        onClick={handleStartMetadataEdit}
                        className="h-10 px-3 rounded-[10px] bg-white/[0.08] hover:bg-white/[0.14] text-[12px] font-medium text-white/70 transition-colors sm:col-span-2"
                      >
                        Modifier titre / artiste
                      </button>
                      <button
                        onClick={handleDeleteSong}
                        disabled={deletingSong}
                        className="h-10 px-3 rounded-[10px] bg-white/[0.08] hover:bg-white/[0.14] disabled:opacity-40 disabled:cursor-not-allowed text-[12px] font-semibold text-white/70 transition-colors sm:col-span-2"
                      >
                        {deletingSong ? 'Suppression...' : 'Supprimer cette chanson (admin)'}
                      </button>
                    </>
                  )}
                </div>
                {lrcEditMessage && (
                  <p className={`mt-3 text-[12px] ${lrcEditMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {lrcEditMessage.text}
                  </p>
                )}
                {metadataMessage && (
                  <p className={`mt-3 text-[12px] ${metadataMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {metadataMessage.text}
                  </p>
                )}
              </div>

              {isEditingMetadata && (
                <div className="rounded-[20px] bg-white/[0.04] border border-white/[0.06] p-4 sm:p-5 space-y-3">
                  <h3 className="text-[12px] font-semibold text-white/80">Modification des informations du son</h3>
                  <p className="text-[12px] text-white/45 leading-relaxed">
                    Mettez à jour uniquement le titre, l’artiste principal et les collaborations, sans changer les paroles ni la synchronisation.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/35 mb-1.5">Titre *</label>
                      <input
                        value={metadataTitle}
                        onChange={(e) => setMetadataTitle(e.target.value)}
                        className="w-full rounded-[10px] border border-white/[0.12] bg-black/20 px-3 py-2.5 text-[13px] text-white/80 focus:outline-none focus:border-[--accent]"
                        placeholder="Nom du son"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/35 mb-1.5">Artiste principal *</label>
                      <input
                        value={metadataArtist}
                        onChange={(e) => setMetadataArtist(e.target.value)}
                        className="w-full rounded-[10px] border border-white/[0.12] bg-black/20 px-3 py-2.5 text-[13px] text-white/80 focus:outline-none focus:border-[--accent]"
                        placeholder="Artiste principal"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-white/35 mb-1.5">Collaborations (optionnel)</label>
                    <input
                      value={metadataCollaborations}
                      onChange={(e) => setMetadataCollaborations(e.target.value)}
                      className="w-full rounded-[10px] border border-white/[0.12] bg-black/20 px-3 py-2.5 text-[13px] text-white/80 focus:outline-none focus:border-[--accent]"
                      placeholder="Ex: Morijah, Dena Mwana"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleSaveMetadata}
                      disabled={savingMetadata}
                      className="h-10 px-4 rounded-[10px] bg-[--accent] hover:bg-[--accent-hover] disabled:opacity-40 text-[12px] font-semibold text-white transition-colors"
                    >
                      {savingMetadata ? 'Enregistrement...' : 'Enregistrer les informations'}
                    </button>
                    <button
                      onClick={handleCancelMetadataEdit}
                      disabled={savingMetadata}
                      className="h-10 px-4 rounded-[10px] bg-white/[0.08] hover:bg-white/[0.14] disabled:opacity-40 text-[12px] font-medium text-white/70 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {isEditingLrc && (
                <div className="rounded-[20px] bg-white/[0.04] border border-white/[0.06] p-4 sm:p-5 space-y-3">
                  <h3 className="text-[12px] font-semibold text-white/80">Correction rapide LRC</h3>
                  <p className="text-[12px] text-white/45 leading-relaxed">
                    Corrige uniquement le texte après les timestamps pour garder la synchronisation.
                  </p>
                  <textarea
                    value={lrcDraft}
                    onChange={(e) => setLrcDraft(e.target.value)}
                    rows={12}
                    className="w-full rounded-[12px] border border-white/[0.12] bg-black/20 p-3 text-[12px] font-mono text-white/80 focus:outline-none focus:border-[--accent]"
                    placeholder="[00:10.50]Première ligne corrigée"
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleSaveLrcCorrection}
                      disabled={savingLrc}
                      className="h-10 px-4 rounded-[10px] bg-[--accent] hover:bg-[--accent-hover] disabled:opacity-40 text-[12px] font-semibold text-white transition-colors"
                    >
                      {savingLrc ? 'Enregistrement...' : 'Enregistrer la correction'}
                    </button>
                    <button
                      onClick={handleCancelLrcEdit}
                      disabled={savingLrc}
                      className="h-10 px-4 rounded-[10px] bg-white/[0.08] hover:bg-white/[0.14] disabled:opacity-40 text-[12px] font-medium text-white/70 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {/* Related songs */}
              {related.length > 0 && (
                <div className="rounded-[20px] bg-white/[0.04] border border-white/[0.06] p-5">
                  <h3 className="text-[11px] font-medium uppercase tracking-wider text-white/30 mb-3">À découvrir aussi</h3>
                  <div className="space-y-1">
                    {related.map((r) => (
                      <Link
                        key={r.id}
                        href={`/songs/${r.id}`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] hover:bg-white/[0.04] transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-[8px] bg-gradient-to-br from-[#a78bfa] to-[#6c5ce7] flex-shrink-0 flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-medium text-white/80 truncate group-hover:text-white transition-colors">{r.title}</div>
                          <div className="text-[11px] text-white/30 truncate">{r.artist_name}</div>
                        </div>
                        <svg className="w-3.5 h-3.5 text-white/15 group-hover:text-white/40 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
