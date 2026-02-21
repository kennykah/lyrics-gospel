'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadRole = async (userId: string | null | undefined) => {
      if (!mounted) return;
      if (!userId) {
        setRole(null);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (!mounted) return;
      setRole(data?.role ?? null);
    };

    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
      await loadRole(data.user?.id);
      setLoading(false);
    };
    getUser();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      void loadRole(session?.user?.id);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-black/[0.04] animate-pulse" />
    );
  }

  if (!email) {
    return (
      <Link
        href="/auth/login"
        className="w-8 h-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] flex items-center justify-center transition-colors"
        aria-label="Se connecter"
      >
        <svg className="w-4 h-4 text-[--text-secondary]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6c5ce7] to-[#a78bfa] flex items-center justify-center text-white text-xs font-semibold shadow-sm hover:shadow-md transition-shadow"
        aria-label="Mon compte"
      >
        {email[0].toUpperCase()}
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 z-50 glass-heavy rounded-[14px] border border-black/[0.08] shadow-xl animate-scale-in overflow-hidden">
            <div className="px-4 py-3 border-b border-black/[0.06]">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[--text-tertiary]">Connecté</p>
              <p className="text-[13px] font-medium text-[--text-primary] truncate mt-0.5">{email}</p>
            </div>
            <div className="py-1">
              <Link
                href="/sync"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-[13px] text-[--text-primary] hover:bg-black/[0.04] transition-colors"
              >
                Mon Espace
              </Link>
              <Link
                href="/upload"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-[13px] text-[--text-primary] hover:bg-black/[0.04] transition-colors"
              >
                Importer un LRC
              </Link>
              {role === 'admin' && (
                <Link
                  href="/admin/stats"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-[13px] text-[--text-primary] hover:bg-black/[0.04] transition-colors"
                >
                  Stats admin
                </Link>
              )}
            </div>
            <div className="py-1 border-t border-black/[0.06]">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
