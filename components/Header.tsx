import Link from 'next/link';
import AuthStatus from '@/components/AuthStatus';

export default function Header() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-gray-200">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-semibold text-gray-900">
          Gospel Lyrics
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-700">
          <Link href="/upload" className="hover:text-purple-700">
            Import LRC
          </Link>
          <Link href="/sync" className="hover:text-purple-700">
            Tap-to-sync
          </Link>
          <Link href="/songs" className="hover:text-purple-700">
            Chansons
          </Link>
        </nav>
        <AuthStatus />
      </div>
    </header>
  );
}
