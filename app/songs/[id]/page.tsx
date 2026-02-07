'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchLrcBySongId, fetchSongById, fetchRelatedSongs } from '@/lib/supabaseData';
import type { Song, LrcFile } from '@/types';
import AppleLyricPlayer from '@/components/AppleLyricPlayer';

export default function SongDetailPage() {
  const params = useParams<{ id: string }>();
  const songId = params?.id as string;
  const [song, setSong] = useState<Song | null>(null);
  const [lrc, setLrc] = useState<LrcFile | null>(null);
  const [related, setRelated] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lyrics' | 'message'>('lyrics');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Parallel fetch for performance
      const [songRes, lrcRes] = await Promise.all([
        fetchSongById(songId),
        fetchLrcBySongId(songId),
      ]);
      const songData = songRes.data as Song;
      setSong(songData);
      setLrc(lrcRes.data as LrcFile);

      // Fetch related after we have artist name
      if (songData) {
        const relRes = await fetchRelatedSongs(songId, songData.artist_name, 4);
        setRelated((relRes.data as Song[]) || []);
      }
      setLoading(false);
    };
    if (songId) load();
  }, [songId]);

  const syncedLyrics = useMemo(() => lrc?.synced_lyrics || [], [lrc]);

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
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
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
        <div className="max-w-[1400px] mx-auto px-6 pb-12">
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
                  <p className="text-white/50 text-[15px]">{song.artist_name}</p>
                  {song.album && (
                    <p className="text-white/30 text-[13px] mt-0.5">{song.album}{song.release_year ? ` \u00B7 ${song.release_year}` : ''}</p>
                  )}
                </div>
              </div>

              {/* Lyric player */}
              {syncedLyrics.length > 0 ? (
                <AppleLyricPlayer syncedLyrics={syncedLyrics} lrcRaw={lrc?.lrc_raw} />
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
                <div className="rounded-[20px] bg-white/[0.04] border border-white/[0.06] p-6 space-y-5" role="tabpanel">
                  <div>
                    <h3 className="text-[11px] font-medium uppercase tracking-wider text-white/30 mb-3">Détails</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-[14px]">
                        <span className="text-white/40">Artiste</span>
                        <Link href={`/songs?q=${encodeURIComponent(song.artist_name)}`} className="text-white/80 font-medium hover:text-[--accent] transition-colors">
                          {song.artist_name}
                        </Link>
                      </div>
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
