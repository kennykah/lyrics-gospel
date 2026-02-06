'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/songs`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setMessage('Compte créé. Vérifiez vos emails pour confirmer si nécessaire.');
    router.push('/songs');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-6 py-16 max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer un compte</h1>
        <p className="text-gray-600 mb-8">Rejoignez Gospel Lyrics pour sauvegarder vos synchronisations.</p>

        {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
        {message && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">{message}</div>}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer un compte'}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-6">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="text-purple-700 hover:text-purple-800">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
