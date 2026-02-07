'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setAuthenticated(true);
      } else {
        router.replace('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
      }
      setChecking(false);
    };
    check();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[--accent]/20 border-t-[--accent] rounded-full animate-spin" />
          <p className="text-[13px] text-[--text-tertiary]">Vérification...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) return null;

  return <>{children}</>;
}
