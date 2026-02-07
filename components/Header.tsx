'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import AuthStatus from '@/components/AuthStatus';

const navLinks = [
  { href: '/songs', label: 'Découvrir', icon: '🎵' },
  { href: '/artists', label: 'Artistes', icon: '🎤' },
  { href: '/sync', label: 'Contribuer', icon: '⏱' },
  { href: '/upload', label: 'Importer', icon: '📄' },
];

/* Pages that have a dark background behind the header */
const darkPages = ['/', '/sync'];
const darkPrefixes = ['/songs/', '/artists/'];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Is the current page dark at the top?
  const isDarkPage =
    darkPages.includes(pathname) ||
    darkPrefixes.some((p) => pathname.startsWith(p));

  // When on a dark page and NOT scrolled → white text, transparent bg
  // When scrolled → glass bg and dark text
  const isLight = scrolled || !isDarkPage;

  // Detect scroll for enhanced glass effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/songs') return pathname === '/songs';
    if (href === '/artists') return pathname === '/artists' || pathname?.startsWith('/artists/');
    return pathname === href;
  };

  const openSpotlight = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }));
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass-heavy border-b border-black/[0.06] shadow-sm'
          : isDarkPage
            ? 'bg-transparent'
            : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-[52px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-[#6c5ce7] to-[#a78bfa] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <span className="text-white text-xs font-bold tracking-tight">GL</span>
          </div>
          <span className={`text-[15px] font-semibold tracking-[-0.02em] hidden sm:block transition-colors duration-300 ${
            isLight ? 'text-[--text-primary]' : 'text-white'
          }`}>
            Gospel Lyrics
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-0.5" role="navigation" aria-label="Navigation principale">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-4 py-1.5 text-[13px] font-medium rounded-full transition-all duration-200 ${
                isActive(link.href)
                  ? 'text-[--accent] bg-[--accent-light]'
                  : isLight
                    ? 'text-[--text-secondary] hover:text-[--text-primary] hover:bg-black/[0.04]'
                    : 'text-white/70 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[--accent]" />
              )}
            </Link>
          ))}
        </nav>

        {/* Right side: Spotlight trigger + Auth */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={openSpotlight}
            className={`flex items-center gap-2 h-8 px-3.5 rounded-[10px] text-[13px] transition-colors cursor-pointer min-w-[180px] group ${
              isLight
                ? 'bg-black/[0.04] text-[--text-tertiary] hover:bg-black/[0.06]'
                : 'bg-white/[0.08] text-white/50 hover:bg-white/[0.12]'
            }`}
          >
            <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <span className="flex-1 text-left">Rechercher...</span>
            <kbd className={`hidden lg:inline px-1.5 py-0.5 rounded text-[10px] font-mono ${
              isLight
                ? 'bg-black/[0.04] text-[--text-tertiary] group-hover:bg-black/[0.06]'
                : 'bg-white/[0.06] text-white/30 group-hover:bg-white/[0.1]'
            }`}>
              ⌘K
            </kbd>
          </button>

          <AuthStatus />
        </div>

        {/* Mobile: search + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={openSpotlight}
            className={`w-9 h-9 flex items-center justify-center rounded-[10px] transition-colors ${
              isLight ? 'hover:bg-black/[0.04]' : 'hover:bg-white/[0.08]'
            }`}
            aria-label="Rechercher"
          >
            <svg className={`w-5 h-5 ${isLight ? 'text-[--text-secondary]' : 'text-white/70'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`w-9 h-9 flex items-center justify-center rounded-[10px] transition-colors ${
              isLight ? 'hover:bg-black/[0.04]' : 'hover:bg-white/[0.08]'
            }`}
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileOpen}
          >
            <svg className={`w-5 h-5 ${isLight ? 'text-[--text-primary]' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass-heavy border-t border-black/[0.06] animate-fade-in">
          <nav className="px-6 py-4 space-y-1" role="navigation" aria-label="Navigation mobile">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 text-[15px] font-medium rounded-[12px] transition-all ${
                  isActive(link.href)
                    ? 'text-[--accent] bg-[--accent-light]'
                    : 'text-[--text-secondary] hover:text-[--text-primary] hover:bg-black/[0.04]'
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-black/[0.06]">
              <AuthStatus />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
