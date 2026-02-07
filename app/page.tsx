'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchRecentSongs, fetchSongCount, fetchLrcCount, fetchDistinctArtists } from '@/lib/supabaseData';
import type { Song } from '@/types';

/* ── Verse of the Day — rotates daily ── */
const bibleVerses = [
  { text: 'Chantez à l\'Éternel un cantique nouveau ! Car il a fait des prodiges.', ref: 'Psaume 98:1' },
  { text: 'Que la parole de Christ habite parmi vous abondamment ; instruisez-vous et exhortez-vous les uns les autres en toute sagesse, par des psaumes, par des hymnes, par des cantiques spirituels.', ref: 'Colossiens 3:16' },
  { text: 'Louez-le avec la harpe et le luth ! Louez-le avec le tambourin et avec des danses !', ref: 'Psaume 150:3-4' },
  { text: 'L\'Éternel, ton Dieu, est au milieu de toi, comme un héros qui sauve ; Il fera de toi sa plus grande joie.', ref: 'Sophonie 3:17' },
  { text: 'Je chanterai à l\'Éternel, car il m\'a fait du bien.', ref: 'Psaume 13:6' },
  { text: 'Car la parole de Dieu est vivante et efficace, plus tranchante qu\'une épée quelconque à deux tranchants.', ref: 'Hébreux 4:12' },
  { text: 'Entrez dans ses portes avec des louanges, dans ses parvis avec des cantiques ! Célébrez-le, bénissez son nom !', ref: 'Psaume 100:4' },
];

function getVerseOfTheDay() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return bibleVerses[dayOfYear % bibleVerses.length];
}

/* ── Impact quotes for hero cards ── */
const impactQuotes = [
  {
    quote: '"Dans la tempête, Il reste mon ancre"',
    artist: 'Elysée Worship',
    album: 'Ancre de mon âme',
    gradient: 'from-[#a78bfa] via-[#c084fc] to-[#f472b6]',
  },
  {
    quote: '"Ta grâce suffit, même quand je doute"',
    artist: 'Nova Praise',
    album: 'Grâce Infinie',
    gradient: 'from-[#f59e0b] via-[#f97316] to-[#ec4899]',
  },
  {
    quote: '"Je suis né pour briller de Ta lumière"',
    artist: 'Lumière Collective',
    album: 'Né pour briller',
    gradient: 'from-[#06b6d4] via-[#3b82f6] to-[#6366f1]',
  },
];

/* ── Animated counter hook ── */
function useAnimatedCount(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const step = Math.max(1, Math.floor(target / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

export default function Home() {
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [songCount, setSongCount] = useState(0);
  const [lrcCount, setLrcCount] = useState(0);
  const [artists, setArtists] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  const animatedSongs = useAnimatedCount(songCount);
  const animatedLrcs = useAnimatedCount(lrcCount);
  const animatedArtists = useAnimatedCount(artists.length);

  const verse = getVerseOfTheDay();

  useEffect(() => {
    const load = async () => {
      const [songsRes, countRes, lrcCountRes, artistsRes] = await Promise.all([
        fetchRecentSongs(6),
        fetchSongCount(),
        fetchLrcCount(),
        fetchDistinctArtists(10),
      ]);
      setRecentSongs((songsRes.data as Song[]) || []);
      setSongCount(countRes);
      setLrcCount(lrcCountRes);
      setArtists(artistsRes);
      setLoaded(true);
    };
    load();
  }, []);

  const artistColors = [
    'from-[#f97316] to-[#ef4444]',
    'from-[#8b5cf6] to-[#6366f1]',
    'from-[#06b6d4] to-[#3b82f6]',
    'from-[#ec4899] to-[#f43f5e]',
    'from-[#10b981] to-[#059669]',
    'from-[#f59e0b] to-[#d97706]',
    'from-[#6366f1] to-[#8b5cf6]',
    'from-[#14b8a6] to-[#0d9488]',
    'from-[#e11d48] to-[#be123c]',
    'from-[#7c3aed] to-[#5b21b6]',
  ];

  return (
    <div className="min-h-screen bg-[--background]">
      {/* ═══════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════ */}
      <section className="relative w-full min-h-[88vh] flex items-center justify-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0533] via-[#0d0d12] to-[#0a1628]" />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/15 rounded-full blur-[100px]" style={{ animationDelay: '1.5s', animation: 'float 4s ease-in-out infinite' }} />
        <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-pink-500/10 rounded-full blur-[80px]" style={{ animation: 'float 5s ease-in-out infinite reverse' }} />

        {/* Hero content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto pt-16">
          {/* Pill badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[13px] text-white/60">{songCount > 0 ? `${songCount} chansons disponibles` : 'Bienvenue sur Gospel Lyrics'}</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-[80px] lg:text-[96px] font-bold leading-[0.92] tracking-[-0.04em] text-white mb-6 animate-fade-in-up">
            Chaque parole
            <span className="block gradient-text mt-1">transforme une vie</span>
          </h1>
          <p className="text-base sm:text-lg text-white/50 max-w-xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            La plateforme qui connecte les paroles gospel aux cœurs.
            Découvrez, synchronisez, partagez.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <Link
              href="/songs"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-white text-[#1d1d1f] text-[15px] font-semibold hover:bg-white/90 transition-all duration-300 shadow-lg shadow-white/10"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Explorer les paroles
            </Link>
            <Link
              href="/sync"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/[0.12] text-white text-[15px] font-medium hover:bg-white/[0.15] transition-all duration-300"
            >
              Contribuer
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-16 flex items-center justify-center gap-8 sm:gap-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">{animatedSongs}</div>
              <div className="text-[12px] text-white/30 mt-0.5 uppercase tracking-wider">Chansons</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">{animatedLrcs}</div>
              <div className="text-[12px] text-white/30 mt-0.5 uppercase tracking-wider">Synchronisées</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">{animatedArtists}</div>
              <div className="text-[12px] text-white/30 mt-0.5 uppercase tracking-wider">Artistes</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
            <div className="w-1 h-2.5 rounded-full bg-white/40 animate-pulse" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          VERSET DU JOUR
          ═══════════════════════════════════════════ */}
      <section className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="relative rounded-[24px] bg-gradient-to-r from-[--accent]/5 via-purple-50 to-[--accent]/5 border border-[--accent]/10 p-8 sm:p-10 overflow-hidden">
          {/* Decorative cross */}
          <div className="absolute top-4 right-6 text-[--accent]/10 text-6xl font-serif select-none">✝</div>

          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full bg-[--accent]/10 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-[--accent]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <span className="text-[12px] font-semibold text-[--accent] uppercase tracking-wider">Verset du jour</span>
          </div>
          <blockquote className="text-xl sm:text-2xl font-semibold text-[--text-primary] leading-relaxed tracking-[-0.02em] max-w-3xl">
            &laquo;&nbsp;{verse.text}&nbsp;&raquo;
          </blockquote>
          <p className="mt-4 text-[14px] font-medium text-[--accent]">{verse.ref}</p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          AJOUTÉS RÉCEMMENT (dynamic from Supabase)
          ═══════════════════════════════════════════ */}
      {loaded && recentSongs.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-6 pb-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[--text-primary] tracking-[-0.03em]">
                Ajoutées récemment
              </h2>
              <p className="text-[--text-secondary] text-[15px] mt-1.5">
                Les dernières paroles ajoutées par la communauté
              </p>
            </div>
            <Link href="/songs" className="btn-ghost text-[13px]">
              Voir tout
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {recentSongs.map((song) => (
              <Link
                key={song.id}
                href={`/songs/${song.id}`}
                className="card-apple p-5 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-[#a78bfa] to-[#6c5ce7] flex-shrink-0 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                    <svg className="w-6 h-6 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15px] font-semibold text-[--text-primary] truncate group-hover:text-[--accent] transition-colors">
                      {song.title}
                    </h3>
                    <p className="text-[13px] text-[--text-secondary] truncate">{song.artist_name}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[--surface] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-3.5 h-3.5 text-[--accent] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                {song.lyrics_text && (
                  <p className="mt-3 text-[13px] text-[--text-tertiary] line-clamp-2 leading-relaxed">
                    {song.lyrics_text}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          PAROLES QUI IMPACTENT (curated)
          ═══════════════════════════════════════════ */}
      <section className="max-w-[1200px] mx-auto px-6 pb-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[--text-primary] tracking-[-0.03em]">
              Paroles qui Impactent
            </h2>
            <p className="text-[--text-secondary] text-[15px] mt-1.5">
              Des messages qui résonnent profondément
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {impactQuotes.map((item, i) => (
            <Link
              key={i}
              href="/songs"
              className={`group relative rounded-[24px] bg-gradient-to-br ${item.gradient} p-8 min-h-[240px] flex flex-col justify-between overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-xl`}
            >
              <div className="absolute top-[-30%] right-[-20%] w-[60%] h-[60%] bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-black/10 rounded-full blur-3xl" />

              <p className="relative z-10 text-xl sm:text-2xl font-bold text-white leading-snug tracking-[-0.02em]">
                {item.quote}
              </p>

              <div className="relative z-10 flex items-center justify-between mt-6">
                <div>
                  <p className="text-white font-semibold text-[14px]">{item.artist}</p>
                  <p className="text-white/60 text-[13px]">{item.album}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all">
                  <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ARTISTES (dynamic from Supabase)
          ═══════════════════════════════════════════ */}
      {artists.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-6 pb-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[--text-primary] tracking-[-0.03em]">
                Artistes
              </h2>
              <p className="text-[--text-secondary] text-[15px] mt-1.5">
                Les voix du gospel sur la plateforme
              </p>
            </div>
            <Link href="/artists" className="btn-ghost text-[13px]">
              Voir tous →
            </Link>
          </div>

          <div className="flex gap-5 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory">
            {artists.map((name, i) => (
              <Link
                key={name}
                href={`/artists/${encodeURIComponent(name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 80))}`}
                className="group flex-shrink-0 w-[180px] snap-start"
              >
                <div className={`w-full aspect-square rounded-[24px] bg-gradient-to-br ${artistColors[i % artistColors.length]} mb-4 overflow-hidden relative transition-all duration-500 group-hover:shadow-lg group-hover:scale-[1.02]`}>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl font-bold text-white/20">{name[0]}</span>
                  </div>
                </div>
                <h3 className="text-[14px] font-semibold text-[--text-primary] group-hover:text-[--accent] transition-colors truncate">
                  {name}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          HOW IT WORKS — Onboarding
          ═══════════════════════════════════════════ */}
      <section className="bg-[--surface] border-t border-[--border]">
        <div className="max-w-[1200px] mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[--text-primary] tracking-[-0.03em]">
              Comment ça marche
            </h2>
            <p className="text-[--text-secondary] text-[15px] mt-1.5">
              En 3 étapes simples
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
            {[
              {
                step: '01',
                title: 'Trouvez une chanson',
                desc: 'Parcourez la bibliothèque ou recherchez par titre et artiste avec ⌘K.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'Écoutez & lisez',
                desc: 'Les paroles se synchronisent avec l\'audio, comme sur Apple Music. Suivez chaque mot.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Contribuez',
                desc: 'Synchronisez de nouvelles paroles avec Tap-to-Sync ou importez un fichier LRC.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-[16px] bg-[--accent]/8 flex items-center justify-center mx-auto mb-4 text-[--accent]">
                  {item.icon}
                </div>
                <div className="text-[11px] font-bold text-[--accent] uppercase tracking-widest mb-2">{item.step}</div>
                <h3 className="text-[17px] font-semibold text-[--text-primary] mb-2">{item.title}</h3>
                <p className="text-[14px] text-[--text-secondary] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link href="/songs" className="btn-primary">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Commencer maintenant
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════ */}
      <footer className="border-t border-[--border] bg-[--background]">
        <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[7px] bg-gradient-to-br from-[#6c5ce7] to-[#a78bfa] flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">GL</span>
            </div>
            <span className="text-[13px] text-[--text-secondary]">
              Gospel Lyrics © {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-6 text-[13px] text-[--text-tertiary]">
            <Link href="/songs" className="hover:text-[--text-primary] transition-colors">Découvrir</Link>
            <Link href="/sync" className="hover:text-[--text-primary] transition-colors">Contribuer</Link>
            <Link href="/auth/login" className="hover:text-[--text-primary] transition-colors">Connexion</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
