'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { deleteArtistWithSongs, fetchArtistBySlug, fetchSongsByArtistName, fetchArtistSongCount, toggleFeaturedArtist, fetchUserRole, fetchAllArtists, fetchDistinctArtists } from '@/lib/supabaseData';
import type { Artist, Song } from '@/types';
import { slugifyArtistName } from '@/utils/artistSlug';

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const socialIcons: Record<string, { label: string; icon: React.ReactNode }> = {
  instagram: {
    label: 'Instagram',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  youtube: {
    label: 'YouTube',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  facebook: {
    label: 'Facebook',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  twitter: {
    label: 'Twitter / X',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  spotify: {
    label: 'Spotify',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
    ),
  },
};

export default function ArtistDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.id as string;

  const [artist, setArtist] = useState<Artist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [songCount, setSongCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [featureToggling, setFeatureToggling] = useState(false);
  const [isVirtualArtist, setIsVirtualArtist] = useState(false);
  const [deletingArtist, setDeletingArtist] = useState(false);

  useEffect(() => {
    if (!slug) return;
    loadArtist();
  }, [slug]);

  async function loadArtist() {
    setLoading(true);
    setNotFound(false);
    const [artistRes, roleRes, allArtistsRes, songArtists] = await Promise.all([
      fetchArtistBySlug(slug),
      fetchUserRole(),
      fetchAllArtists(),
      fetchDistinctArtists(500),
    ]);

    setUserRole(roleRes);

    const allArtists = (allArtistsRes.data as Artist[]) || [];
    const artistByNormalizedName = allArtists.find((item) => slugifyArtistName(item.name) === slug) || null;
    const artistData = (artistRes.data as Artist | null) || artistByNormalizedName;

    if (artistData) {
      setArtist(artistData);
      setIsVirtualArtist(false);

      const [songsRes, count] = await Promise.all([
        fetchSongsByArtistName(artistData.name),
        fetchArtistSongCount(artistData.name),
      ]);

      setSongs((songsRes.data as Song[]) || []);
      setSongCount(count);
      setLoading(false);
      return;
    }

    const fallbackName = songArtists.find((name) => slugifyArtistName(name) === slug);
    if (!fallbackName) {
      setNotFound(true);
      setArtist(null);
      setSongs([]);
      setSongCount(0);
      setLoading(false);
      return;
    }

    setArtist({
      id: `virtual-${slug}`,
      name: fallbackName,
      slug: slugifyArtistName(fallbackName),
    });
    setIsVirtualArtist(true);

    const [songsRes, count] = await Promise.all([
      fetchSongsByArtistName(fallbackName),
      fetchArtistSongCount(fallbackName),
    ]);
    setSongs((songsRes.data as Song[]) || []);
    setSongCount(count);
    setLoading(false);
  }

  const handleToggleFeatured = async () => {
    if (!artist || isVirtualArtist) return;
    setFeatureToggling(true);
    await toggleFeaturedArtist(artist.id, !artist.is_featured);
    const res = await fetchArtistBySlug(slug);
    if (res.data) setArtist(res.data as Artist);
    setFeatureToggling(false);
  };

  const handleDeleteArtistWithSongs = async () => {
    if (!artist || userRole !== 'admin') return;

    const confirmed = window.confirm(`Supprimer ${artist.name} et toutes ses chansons ? Cette action est irréversible.`);
    if (!confirmed) return;

    setDeletingArtist(true);
    const { error } = await deleteArtistWithSongs({
      artistId: isVirtualArtist ? undefined : artist.id,
      artistName: artist.name,
    });

    if (error) {
      setDeletingArtist(false);
      return;
    }

    router.push('/artists');
  };

  const latestSong = songs[0];
  const otherSongs = songs.slice(1);

  if (loading) {
    return (
      <div className="min-h-screen bg-[--background] pt-[52px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[--accent]/20 border-t-[--accent] rounded-full animate-spin" />
          <p className="text-[--text-tertiary] text-[13px]">Chargement...</p>
        </div>
      </div>
    );
  }

  if (notFound || !artist) {
    return (
      <div className="min-h-screen bg-[--background] pt-[52px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[--surface] flex items-center justify-center">
            <svg className="w-7 h-7 text-[--text-tertiary]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <p className="text-[--text-secondary] text-[15px] mb-3">Artiste introuvable.</p>
          <Link href="/artists" className="text-[13px] text-[--accent] hover:underline">
            Retour aux artistes
          </Link>
        </div>
      </div>
    );
  }

  const hasSocials = artist.social_links && Object.values(artist.social_links).some(Boolean);

  return (
    <div className="min-h-screen bg-[--background]">

      {/* ══ Hero banner ══ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0533] via-[#0d0d12] to-[#0a1628]" />
        <div className="absolute top-[-20%] left-[10%] w-[50%] h-[60%] bg-purple-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-30%] right-[5%] w-[40%] h-[50%] bg-blue-500/15 rounded-full blur-[80px]" />

        <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 pt-[100px] pb-12 sm:pb-16">
          <Link href="/artists" className="inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/70 transition-colors mb-8">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Artistes
          </Link>

          <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
            {/* Avatar */}
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-[24px] bg-gradient-to-br from-[#a78bfa] to-[#6c5ce7] flex items-center justify-center flex-shrink-0 shadow-2xl shadow-purple-500/30 overflow-hidden">
              {artist.image_url ? (
                <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-4xl sm:text-5xl font-bold">{getInitials(artist.name)}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                {artist.is_featured && (
                  <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[11px] font-semibold uppercase tracking-wider">
                    ⭐ En vedette
                  </span>
                )}
                {artist.country && (
                  <span className="text-white/30 text-[13px]">{artist.country}</span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-[-0.03em] mb-2">
                {artist.name}
              </h1>

              {artist.ministry && (
                <p className="text-white/50 text-[15px] mb-3">{artist.ministry}</p>
              )}

              <div className="flex items-center gap-4 text-[13px] text-white/30">
                <span>{songCount} chanson{songCount > 1 ? 's' : ''}</span>
                {artist.website_url && (
                  <>
                    <span>·</span>
                    <a
                      href={artist.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[--accent] hover:underline"
                    >
                      Site web
                    </a>
                  </>
                )}
              </div>

              {/* Admin controls */}
              {userRole === 'admin' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {!isVirtualArtist && (
                    <button
                      onClick={handleToggleFeatured}
                      disabled={featureToggling}
                      className="px-4 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white/60 text-[12px] font-medium transition-colors disabled:opacity-30"
                    >
                      {featureToggling ? '...' : artist.is_featured ? 'Retirer la mise en avant' : '⭐ Mettre en avant'}
                    </button>
                  )}
                  <button
                    onClick={handleDeleteArtistWithSongs}
                    disabled={deletingArtist}
                    className="px-4 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white/60 text-[12px] font-medium transition-colors disabled:opacity-30"
                  >
                    {deletingArtist ? 'Suppression...' : 'Supprimer artiste + chansons'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══ Content ══ */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main content (left 2 cols) ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Bio */}
            {artist.bio && (
              <div className="card-apple p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-[--text-primary] mb-4 flex items-center gap-2">
                  <svg className="w-4.5 h-4.5 text-[--accent]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  Biographie
                </h2>
                <p className="text-[14px] sm:text-[15px] text-[--text-secondary] leading-relaxed whitespace-pre-line">
                  {artist.bio}
                </p>
              </div>
            )}

            {/* Quote */}
            {artist.quote && (
              <div className="relative rounded-[20px] bg-gradient-to-r from-[--accent]/5 via-purple-50 to-[--accent]/5 border border-[--accent]/10 p-6 sm:p-8 overflow-hidden">
                <div className="absolute top-3 right-5 text-[--accent]/10 text-5xl font-serif select-none">&ldquo;</div>
                <blockquote className="relative z-10">
                  <p className="text-lg sm:text-xl font-semibold text-[--text-primary] leading-relaxed tracking-[-0.01em] italic">
                    &laquo;&nbsp;{artist.quote}&nbsp;&raquo;
                  </p>
                  <footer className="mt-4 text-[13px] text-[--text-secondary] font-medium">
                    — {artist.name}
                  </footer>
                </blockquote>
              </div>
            )}

            {/* Latest release */}
            {latestSong && (
              <div>
                <h2 className="text-lg font-semibold text-[--text-primary] mb-4 flex items-center gap-2">
                  <svg className="w-4.5 h-4.5 text-[--accent]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                  </svg>
                  Dernier ajout
                </h2>
                <Link
                  href={`/songs/${latestSong.id}`}
                  className="card-apple p-5 sm:p-6 group flex items-center gap-5"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[16px] bg-gradient-to-br from-[#a78bfa] to-[#6c5ce7] flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
                    <svg className="w-7 h-7 text-white/70 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[16px] font-semibold text-[--text-primary] group-hover:text-[--accent] transition-colors truncate">
                      {latestSong.title}
                    </h3>
                    {latestSong.album && (
                      <p className="text-[13px] text-[--text-secondary] mt-0.5">{latestSong.album}</p>
                    )}
                    <p className="text-[12px] text-[--text-tertiary] mt-1">
                      {formatDate(latestSong.created_at)}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-[--text-tertiary] group-hover:text-[--accent] group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            )}

            {/* All songs */}
            {songs.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-[--text-primary] mb-4 flex items-center gap-2">
                  <svg className="w-4.5 h-4.5 text-[--accent]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                  </svg>
                  Toutes les paroles
                  <span className="text-[13px] font-normal text-[--text-tertiary]">({songCount})</span>
                </h2>
                <div className="space-y-2">
                  {songs.map((song, i) => (
                    <Link
                      key={song.id}
                      href={`/songs/${song.id}`}
                      className="flex items-center gap-4 p-4 rounded-[14px] hover:bg-[--surface] transition-colors group"
                    >
                      <span className="text-[13px] text-[--text-tertiary] w-6 text-right tabular-nums font-mono">
                        {i + 1}
                      </span>
                      <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#a78bfa]/20 to-[#6c5ce7]/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-[--accent]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[14px] font-medium text-[--text-primary] group-hover:text-[--accent] transition-colors truncate">
                          {song.title}
                        </h3>
                        {song.album && (
                          <p className="text-[12px] text-[--text-tertiary] truncate">{song.album}</p>
                        )}
                      </div>
                      <span className="text-[12px] text-[--text-tertiary]">
                        {formatDate(song.created_at)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {songs.length === 0 && (
              <div className="card-apple p-8 text-center">
                <p className="text-[--text-secondary] text-[14px]">
                  Aucune parole disponible pour cet artiste.
                </p>
                <Link href="/sync" className="mt-3 inline-block text-[13px] text-[--accent] hover:underline font-medium">
                  Contribuer en ajoutant des paroles →
                </Link>
              </div>
            )}
          </div>

          {/* ── Sidebar (right col) ── */}
          <div className="space-y-6">

            {/* Info card */}
            <div className="card-apple p-6">
              <h3 className="text-[13px] font-semibold text-[--text-secondary] uppercase tracking-wider mb-4">
                Informations
              </h3>
              <dl className="space-y-3">
                {artist.ministry && (
                  <div>
                    <dt className="text-[11px] text-[--text-tertiary] uppercase tracking-wider">Ministère</dt>
                    <dd className="text-[14px] text-[--text-primary] font-medium mt-0.5">{artist.ministry}</dd>
                  </div>
                )}
                {artist.country && (
                  <div>
                    <dt className="text-[11px] text-[--text-tertiary] uppercase tracking-wider">Pays</dt>
                    <dd className="text-[14px] text-[--text-primary] font-medium mt-0.5">{artist.country}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-[11px] text-[--text-tertiary] uppercase tracking-wider">Chansons</dt>
                  <dd className="text-[14px] text-[--text-primary] font-medium mt-0.5">{songCount}</dd>
                </div>
                {artist.created_at && (
                  <div>
                    <dt className="text-[11px] text-[--text-tertiary] uppercase tracking-wider">Ajouté le</dt>
                    <dd className="text-[14px] text-[--text-primary] font-medium mt-0.5">{formatDate(artist.created_at)}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Social links */}
            {hasSocials && (
              <div className="card-apple p-6">
                <h3 className="text-[13px] font-semibold text-[--text-secondary] uppercase tracking-wider mb-4">
                  Réseaux sociaux
                </h3>
                <div className="space-y-2">
                  {Object.entries(artist.social_links || {}).map(([key, url]) => {
                    if (!url) return null;
                    const social = socialIcons[key];
                    if (!social) return null;
                    return (
                      <a
                        key={key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2.5 rounded-[10px] hover:bg-[--surface] transition-colors text-[--text-secondary] hover:text-[--accent] group"
                      >
                        <span className="text-[--text-tertiary] group-hover:text-[--accent] transition-colors">
                          {social.icon}
                        </span>
                        <span className="text-[13px] font-medium">{social.label}</span>
                        <svg className="w-3.5 h-3.5 ml-auto text-[--text-tertiary] opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick action */}
            <div className="card-apple p-6 text-center">
              <p className="text-[13px] text-[--text-secondary] mb-3">
                Vous connaissez des paroles de {artist.name} ?
              </p>
              <Link
                href="/sync"
                className="btn-primary text-[13px] py-2.5 px-5 w-full"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Contribuer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
