'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthGuard({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setAuthenticated(true);

        if (!requireAdmin) {
          setAuthorized(true);
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .maybeSingle();
          setAuthorized(profile?.role === 'admin');
        }
      } else {
        router.replace('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
      }
      setChecking(false);
    };
    check();
  }, [router, requireAdmin]);

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
  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[--surface] flex items-center justify-center">
            <svg className="w-6 h-6 text-[--text-tertiary]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 0h10.5A2.25 2.25 0 0119.5 12.75v6A2.25 2.25 0 0117.25 21h-10.5A2.25 2.25 0 014.5 18.75v-6A2.25 2.25 0 016.75 10.5z" />
            </svg>
          </div>
          <h2 className="text-[18px] font-semibold text-[--text-primary] mb-1">Accès admin requis</h2>
          <p className="text-[14px] text-[--text-secondary]">
            Cette action est réservée aux utilisateurs ayant le rôle admin.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
