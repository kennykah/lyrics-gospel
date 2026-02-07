'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchSongs } from '@/lib/supabaseData';
import type { Song } from '@/types';

export default function SpotlightSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Debounced search
  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await fetchSongs({ page: 1, pageSize: 8, query: q });
    setResults((data as Song[]) || []);
    setLoading(false);
    setSelectedIndex(0);
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 250);
  };

  const navigate = (song: Song) => {
    setOpen(false);
    router.push(`/songs/${song.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      navigate(results[selectedIndex]);
    }
  };

  const quickLinks = [
    { label: 'Découvrir les chansons', icon: '🎵', href: '/songs' },
    { label: 'Synchroniser des paroles', icon: '⏱', href: '/sync' },
    { label: 'Importer un fichier LRC', icon: '📄', href: '/upload' },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Recherche rapide">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="relative mx-auto mt-[15vh] w-full max-w-[580px] px-4 animate-scale-in">
        <div className="glass-heavy rounded-[18px] shadow-2xl border border-black/[0.06] overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-5 border-b border-black/[0.06]">
            <svg className="w-5 h-5 text-[--text-tertiary] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent py-4 text-[16px] text-[--text-primary] placeholder:text-[--text-tertiary] focus:outline-none"
              placeholder="Rechercher un titre, un artiste..."
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden sm:flex items-center gap-0.5 px-2 py-1 rounded-md bg-black/[0.04] text-[11px] text-[--text-tertiary] font-mono">
              ESC
            </kbd>
          </div>

          <div className="max-h-[50vh] overflow-y-auto hide-scrollbar">
            {/* Loading */}
            {loading && (
              <div className="px-5 py-6 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[--accent]/20 border-t-[--accent] rounded-full animate-spin" />
              </div>
            )}

            {/* Results */}
            {!loading && results.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-2 text-[11px] font-semibold text-[--text-tertiary] uppercase tracking-wider">
                  Chansons
                </div>
                {results.map((song, i) => (
                  <button
                    key={song.id}
                    onClick={() => navigate(song)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full flex items-center gap-3.5 px-4 py-2.5 text-left transition-colors ${
                      i === selectedIndex ? 'bg-[--accent]/8' : 'hover:bg-black/[0.02]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#a78bfa] to-[#6c5ce7] flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-medium text-[--text-primary] truncate">{song.title}</div>
                      <div className="text-[12px] text-[--text-secondary] truncate">{song.artist_name}</div>
                    </div>
                    {i === selectedIndex && (
                      <svg className="w-4 h-4 text-[--text-tertiary] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {!loading && query.trim() && results.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-[14px] text-[--text-secondary]">
                  Aucun résultat pour &laquo;&nbsp;{query}&nbsp;&raquo;
                </p>
                <p className="text-[12px] text-[--text-tertiary] mt-1">
                  Essayez un autre terme ou contribuez en ajoutant cette chanson
                </p>
              </div>
            )}

            {/* Quick links (when empty) */}
            {!loading && !query.trim() && (
              <div className="py-2">
                <div className="px-4 py-2 text-[11px] font-semibold text-[--text-tertiary] uppercase tracking-wider">
                  Actions rapides
                </div>
                {quickLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => { setOpen(false); router.push(link.href); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-black/[0.02] transition-colors"
                  >
                    <span className="text-lg w-8 text-center">{link.icon}</span>
                    <span className="text-[14px] text-[--text-primary]">{link.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-black/[0.04] flex items-center justify-between text-[11px] text-[--text-tertiary]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-black/[0.04] font-mono">↑↓</kbd>
                naviguer
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-black/[0.04] font-mono">↵</kbd>
                ouvrir
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-black/[0.04] font-mono">⌘K</kbd>
              rechercher
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
