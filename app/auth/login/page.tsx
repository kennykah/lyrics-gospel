'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/songs';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push(redirectTo);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Entrez votre email.'); return; }
    setLoading(true);
    setError('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/login`,
    });
    if (resetError) { setError(resetError.message); }
    else { setForgotSent(true); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-[52px] relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #f5f5f7 0%, #e8e6ef 50%, #f0eef5 100%)' }}
    >
      {/* Decorative blurs */}
      <div className="absolute top-[-120px] left-[-80px] w-[400px] h-[400px] rounded-full bg-[--accent]/10 blur-[120px]" />
      <div className="absolute bottom-[-100px] right-[-60px] w-[350px] h-[350px] rounded-full bg-purple-400/8 blur-[100px]" />

      <div className="w-full max-w-[400px] animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[--accent] to-purple-600 flex items-center justify-center shadow-lg shadow-[--accent]/25">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          </Link>
          <h1 className="text-[28px] font-bold text-[--text-primary] mt-5 tracking-tight">
            {forgotMode ? 'Réinitialiser' : 'Bon retour'}
          </h1>
          <p className="text-[15px] text-[--text-secondary] mt-1.5">
            {forgotMode ? 'Entrez votre email pour recevoir un lien' : 'Connectez-vous à votre compte Gospel Lyrics'}
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-[20px] p-8 shadow-lg border border-black/[0.04]">
          {error && (
            <div className="mb-5 px-4 py-3 rounded-[12px] bg-red-50 border border-red-200/60 text-[13px] text-red-600 flex items-center gap-2" role="alert">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}
          {forgotSent && (
            <div className="mb-5 px-4 py-3 rounded-[12px] bg-green-50 border border-green-200/60 text-[13px] text-green-600 flex items-center gap-2" role="status">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Lien envoyé ! Vérifiez votre boîte mail.
            </div>
          )}

          {forgotMode ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[--text-secondary] mb-1.5 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-apple w-full"
                  placeholder="vous@email.com"
                  required
                  autoFocus
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-40">
                {loading ? 'Envoi...' : 'Envoyer le lien'}
              </button>
              <button type="button" onClick={() => { setForgotMode(false); setForgotSent(false); setError(''); }} className="w-full text-center text-[13px] text-[--accent] hover:underline mt-2">
                Retour à la connexion
              </button>
            </form>
          ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[--text-secondary] mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-apple w-full"
                placeholder="vous@email.com"
                required
                autoFocus
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[12px] font-medium text-[--text-secondary] uppercase tracking-wider">
                  Mot de passe
                </label>
                <button type="button" onClick={() => setForgotMode(true)} className="text-[11px] text-[--accent] hover:underline">
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-apple w-full pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[--text-tertiary] hover:text-[--text-secondary] transition-colors"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-2 disabled:opacity-40"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
          )}
        </div>

        <p className="text-center text-[13px] text-[--text-tertiary] mt-6">
          Pas encore de compte ?{' '}
          <Link href="/auth/signup" className="text-[--accent] hover:text-[--accent-hover] font-medium transition-colors">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
