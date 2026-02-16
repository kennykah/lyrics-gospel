'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchAllArtists, fetchFeaturedArtist, fetchArtistSongCount, fetchDistinctArtists, toggleFeaturedArtist, fetchUserRole } from '@/lib/supabaseData';
import type { Artist } from '@/types';
import { slugifyArtistName } from '@/utils/artistSlug';

/* ── Gradient palette for artist cards ── */
const cardGradients = [
  'from-[#6c5ce7] to-[#a78bfa]',
  'from-[#f97316] to-[#ef4444]',
  'from-[#06b6d4] to-[#3b82f6]',
  'from-[#ec4899] to-[#f43f5e]',
  'from-[#10b981] to-[#059669]',
  'from-[#f59e0b] to-[#d97706]',
  'from-[#8b5cf6] to-[#6366f1]',
  'from-[#14b8a6] to-[#0d9488]',
  'from-[#e11d48] to-[#be123c]',
  'from-[#7c3aed] to-[#5b21b6]',
];

function getGradient(index: number) {
  return cardGradients[index % cardGradients.length];
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [songArtists, setSongArtists] = useState<string[]>([]);
  const [featured, setFeatured] = useState<Artist | null>(null);
  const [songCounts, setSongCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [featureToggling, setFeatureToggling] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [artistsRes, featuredRes, songArtistsRes, roleRes] = await Promise.all([
      fetchAllArtists(),
      fetchFeaturedArtist(),
      fetchDistinctArtists(50),
      fetchUserRole(),
    ]);

    const dbArtists = (artistsRes.data as Artist[]) || [];
    setArtists(dbArtists);
    setFeatured(featuredRes as Artist | null);
    setSongArtists(songArtistsRes);
    setUserRole(roleRes);

    // Fetch song counts for all artist names (from songs table)
    const allNames = [
      ...new Set([
        ...dbArtists.map((a) => a.name),
        ...songArtistsRes,
      ]),
    ];
    const counts: Record<string, number> = {};
    await Promise.all(
      allNames.map(async (name) => {
        counts[name] = await fetchArtistSongCount(name);
      })
    );
    setSongCounts(counts);
    setLoading(false);
  }

  // Merge DB artists with song artists (some artists only exist in songs)
  const allArtistNames = [
    ...new Set([
      ...artists.map((a) => a.name),
      ...songArtists,
    ]),
  ].sort((a, b) => a.localeCompare(b, 'fr'));

  const getArtistProfile = (name: string): Artist | undefined =>
    artists.find((a) => a.name.toLowerCase() === name.toLowerCase());

  const getArtistSlug = (name: string): string => {
    const profile = getArtistProfile(name);
    if (profile) return profile.slug;
    return slugifyArtistName(name);
  };

  const handleToggleFeatured = async (artistId: string, newState: boolean) => {
    setFeatureToggling(true);
    await toggleFeaturedArtist(artistId, newState);
    const newFeatured = await fetchFeaturedArtist();
    setFeatured(newFeatured as Artist | null);
    // Refresh artists list
    const res = await fetchAllArtists();
    setArtists((res.data as Artist[]) || []);
    setFeatureToggling(false);
  };

  // Pick a random featured artist from songs if no DB featured
  const randomFeatured = !featured && songArtists.length > 0
    ? songArtists[Math.floor(Math.random() * songArtists.length)]
    : null;

  return (
    <div className="min-h-screen bg-[--background] pt-[52px]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">

        {/* ══ Page header ══ */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-[--text-primary] tracking-[-0.03em]">
            Artistes
          </h1>
          <p className="text-[--text-secondary] text-[15px] mt-1.5">
            Découvrez les artistes gospel et leurs paroles
          </p>
        </div>

        {/* ══ Featured artist spotlight ══ */}
        {(featured || randomFeatured) && (
          <section className="mb-14">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-full bg-[--accent]/10 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-[--accent]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
              <span className="text-[12px] font-semibold text-[--accent] uppercase tracking-wider">
                Artiste en lumière
              </span>
            </div>

            {featured ? (
              <Link
                href={`/artists/${featured.slug}`}
                className="block group"
              >
                <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1a0533] via-[#0d0d12] to-[#0a1628] p-8 sm:p-10 border border-white/[0.06]">
                  {/* Decorative blurs */}
                  <div className="absolute top-[-30%] right-[-10%] w-[40%] h-[70%] bg-purple-600/20 rounded-full blur-[80px]" />
                  <div className="absolute bottom-[-20%] left-[-5%] w-[30%] h-[50%] bg-blue-500/15 rounded-full blur-[60px]" />

                  <div className="relative z-10 flex flex-col sm:flex-row items-start gap-6">
                    {/* Artist avatar */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[20px] bg-gradient-to-br from-[#a78bfa] to-[#6c5ce7] flex items-center justify-center flex-shrink-0 shadow-xl shadow-purple-500/20 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                      {featured.image_url ? (
                        <img src={featured.image_url} alt={featured.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-3xl font-bold">{getInitials(featured.name)}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[11px] font-semibold uppercase tracking-wider">
                          ⭐ En vedette
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-[-0.02em] mb-2 group-hover:text-purple-200 transition-colors">
                        {featured.name}
                      </h2>
                      {featured.ministry && (
                        <p className="text-white/40 text-[13px] mb-3">{featured.ministry}{featured.country ? ` · ${featured.country}` : ''}</p>
                      )}
                      {featured.bio && (
                        <p className="text-white/50 text-[14px] leading-relaxed line-clamp-2 max-w-xl">
                          {featured.bio}
                        </p>
                      )}
                      {featured.quote && (
                        <blockquote className="mt-4 text-white/60 text-[15px] italic border-l-2 border-purple-500/40 pl-4">
                          &laquo;&nbsp;{featured.quote}&nbsp;&raquo;
                        </blockquote>
                      )}
                      <div className="mt-4 flex items-center gap-3">
                        <span className="text-white/30 text-[12px]">
                          {songCounts[featured.name] || 0} chanson{(songCounts[featured.name] || 0) > 1 ? 's' : ''}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[--accent] text-[13px] font-medium group-hover:gap-2 transition-all">
                          Voir le profil
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Admin: Toggle featured */}
                  {userRole === 'admin' && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleToggleFeatured(featured.id, false);
                      }}
                      disabled={featureToggling}
                      className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white/50 text-[11px] font-medium transition-colors disabled:opacity-30"
                    >
                      {featureToggling ? '...' : 'Retirer la mise en avant'}
                    </button>
                  )}
                </div>
              </Link>
            ) : randomFeatured ? (
              <Link
                href={`/artists/${slugifyArtistName(randomFeatured)}`}
                className="block group"
              >
                <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1a0533] via-[#0d0d12] to-[#0a1628] p-8 sm:p-10 border border-white/[0.06]">
                  <div className="absolute top-[-30%] right-[-10%] w-[40%] h-[70%] bg-purple-600/20 rounded-full blur-[80px]" />
                  <div className="relative z-10 flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[16px] bg-gradient-to-br from-[#a78bfa] to-[#6c5ce7] flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                      <span className="text-white text-2xl font-bold">{getInitials(randomFeatured)}</span>
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[11px] font-semibold uppercase tracking-wider mb-2 inline-block">
                        Découvrir
                      </span>
                      <h2 className="text-2xl font-bold text-white tracking-[-0.02em] group-hover:text-purple-200 transition-colors">
                        {randomFeatured}
                      </h2>
                      <p className="text-white/40 text-[13px] mt-1">
                        {songCounts[randomFeatured] || 0} chanson{(songCounts[randomFeatured] || 0) > 1 ? 's' : ''} disponible{(songCounts[randomFeatured] || 0) > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ) : null}
          </section>
        )}

        {/* ══ All artists grid ══ */}
        <section>
          <h2 className="text-xl font-bold text-[--text-primary] tracking-[-0.02em] mb-6">
            Tous les artistes
            {!loading && (
              <span className="ml-2 text-[14px] font-normal text-[--text-tertiary]">
                ({allArtistNames.length})
              </span>
            )}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card-apple p-5 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[14px] bg-[--surface] flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[--surface] rounded-full w-3/4" />
                      <div className="h-3 bg-[--surface] rounded-full w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : allArtistNames.length === 0 ? (
            <div className="card-apple p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[--surface] flex items-center justify-center">
                <svg className="w-7 h-7 text-[--text-tertiary]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0012 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[--text-primary] mb-1">Aucun artiste trouvé</h3>
              <p className="text-[14px] text-[--text-secondary]">
                Les artistes apparaîtront ici au fur et à mesure des contributions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
              {allArtistNames.map((name, i) => {
                const profile = getArtistProfile(name);
                const slug = getArtistSlug(name);
                const count = songCounts[name] || 0;

                return (
                  <Link
                    key={name}
                    href={`/artists/${slug}`}
                    className="card-apple p-5 group relative"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className={`w-14 h-14 rounded-[14px] bg-gradient-to-br ${getGradient(i)} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow overflow-hidden`}>
                        {profile?.image_url ? (
                          <img src={profile.image_url} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-lg font-bold">{getInitials(name)}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] font-semibold text-[--text-primary] truncate group-hover:text-[--accent] transition-colors">
                          {name}
                        </h3>
                        <p className="text-[13px] text-[--text-secondary]">
                          {count} chanson{count > 1 ? 's' : ''}
                        </p>
                        {profile?.ministry && (
                          <p className="text-[11px] text-[--text-tertiary] truncate mt-0.5">{profile.ministry}</p>
                        )}
                      </div>

                      {/* Arrow */}
                      <svg className="w-4 h-4 text-[--text-tertiary] group-hover:text-[--accent] group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>

                    {/* Featured badge */}
                    {profile?.is_featured && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600 text-[10px] font-semibold uppercase tracking-wider">
                        ⭐ Vedette
                      </span>
                    )}

                    {/* Admin: Feature toggle */}
                    {userRole === 'admin' && profile && !profile.is_featured && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleToggleFeatured(profile.id, true);
                        }}
                        disabled={featureToggling}
                        className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-[--surface] hover:bg-[--accent-light] text-[10px] text-[--text-tertiary] hover:text-[--accent] font-medium transition-colors disabled:opacity-30"
                      >
                        Mettre en avant
                      </button>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
