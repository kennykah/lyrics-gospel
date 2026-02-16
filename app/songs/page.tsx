'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import { fetchSongs } from '@/lib/supabaseData';
import type { Song } from '@/types';

const PAGE_SIZE = 12;

export default function SongsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[--background] pt-[52px]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
          <div className="h-10 bg-[--surface] rounded-full w-48 mb-10 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card-apple p-5 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-[14px] bg-[--surface] flex-shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 bg-[--surface] rounded-full w-3/4" />
                    <div className="h-3 bg-[--surface] rounded-full w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <SongsContent />
    </Suspense>
  );
}

function SongsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / PAGE_SIZE)), [count]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, count: total, error } = await fetchSongs({ page, pageSize: PAGE_SIZE, query });
      if (!error && data) {
        setSongs(data as Song[]);
        setCount(total || 0);
      }
      setLoading(false);
    };
    load();
  }, [page, query]);

  const handleSearch = (q: string) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('page', '1');
    router.push(`/songs?${params.toString()}`);
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    params.set('page', String(p));
    router.push(`/songs?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[--background] pt-[52px]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
        {/* Page header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold text-[--text-primary] tracking-[-0.03em]">
              Découvrir
            </h1>
            <p className="text-[--text-secondary] text-[15px] mt-1.5">
              {count > 0 ? `${count} paroles synchronisées disponibles` : 'Explorez les paroles synchronisées disponibles'}
            </p>
          </div>
          <Link href="/upload" className="hidden md:inline-flex btn-primary text-[13px] py-2.5 px-5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Importer
          </Link>
        </div>

        {/* Spotlight-style search */}
        <div className="mb-10">
          <SearchBar defaultValue={query} onSearch={handleSearch} />
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card-apple p-5 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-[14px] bg-[--surface] flex-shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 bg-[--surface] rounded-full w-3/4" />
                    <div className="h-3 bg-[--surface] rounded-full w-1/2" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 bg-[--surface] rounded-full w-full" />
                  <div className="h-3 bg-[--surface] rounded-full w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : songs.length === 0 ? (
          <div className="card-apple p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[--surface] flex items-center justify-center">
              <svg className="w-7 h-7 text-[--text-tertiary]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[--text-primary] mb-1">Aucune chanson trouvée</h3>
            <p className="text-[14px] text-[--text-secondary]">
              Essayez un autre terme ou contribuez en ajoutant des paroles.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {songs.map((song) => (
              <Link
                key={song.id}
                href={`/songs/${song.id}`}
                className="card-apple p-5 group"
              >
                <div className="flex items-start gap-4">
                  {/* Album art placeholder */}
                  <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-[#a78bfa] to-[#6c5ce7] flex-shrink-0 flex items-center justify-center shadow-sm">
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
                  {/* Status pill */}
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                    song.status === 'published'
                      ? 'bg-green-50 text-green-600'
                      : 'bg-[--surface] text-[--text-tertiary]'
                  }`}>
                    {song.status === 'published' ? 'Publié' : song.status === 'draft' ? 'Brouillon' : song.status}
                  </span>
                </div>

                {song.lyrics_text && (
                  <p className="mt-3 text-[13px] text-[--text-secondary] line-clamp-2 leading-relaxed">
                    {song.lyrics_text}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => goToPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="h-9 px-4 rounded-[10px] text-[13px] font-medium text-[--text-primary] bg-[--surface] hover:bg-black/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              Précédent
            </button>
            <div className="px-3 text-[13px] text-[--text-secondary]">
              {page} / {totalPages}
            </div>
            <button
              onClick={() => goToPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="h-9 px-4 rounded-[10px] text-[13px] font-medium text-[--text-primary] bg-[--surface] hover:bg-black/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
