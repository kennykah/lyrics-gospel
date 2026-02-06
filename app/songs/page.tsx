'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import { fetchSongs } from '@/lib/supabaseData';
import type { Song } from '@/types';

const PAGE_SIZE = 12;

export default function SongsPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Chansons</h1>
            <p className="text-gray-600">Explorez les paroles synchronisées disponibles.</p>
          </div>
          <Link
            href="/upload"
            className="hidden md:inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700"
          >
            Importer un LRC
          </Link>
        </div>

        <div className="mb-8">
          <SearchBar defaultValue={query} onSearch={handleSearch} />
        </div>

        {loading ? (
          <div className="text-gray-600">Chargement...</div>
        ) : songs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-gray-200">Aucune chanson trouvée.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {songs.map((song) => (
              <Link
                key={song.id}
                href={`/songs/${song.id}`}
                className="group bg-white rounded-2xl p-5 border border-gray-200 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-purple-700">
                      {song.title}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">{song.artist_name}</p>
                  </div>
                  <div className="ml-3 text-xs text-gray-500">{song.status}</div>
                </div>
                {song.lyrics_text && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-3">{song.lyrics_text}</p>
                )}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 flex items-center justify-center gap-2">
          <button
            onClick={() => goToPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 disabled:opacity-50"
          >
            Précédent
          </button>
          <div className="text-sm text-gray-600">
            Page {page} / {totalPages}
          </div>
          <button
            onClick={() => goToPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}
