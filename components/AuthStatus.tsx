'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
      setLoading(false);
    };
    getUser();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="text-sm text-gray-500">...</div>;
  }

  if (!email) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link href="/auth/login" className="text-gray-700 hover:text-purple-700">
          Se connecter
        </Link>
        <Link
          href="/auth/signup"
          className="px-3 py-1.5 rounded-full bg-purple-600 text-white hover:bg-purple-700"
        >
          Créer un compte
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-600 truncate max-w-[160px]">{email}</span>
      <button
        onClick={handleLogout}
        className="px-3 py-1.5 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50"
      >
        Déconnexion
      </button>
    </div>
  );
}
