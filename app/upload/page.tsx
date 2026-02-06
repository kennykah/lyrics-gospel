'use client';

import LrcUploadForm from '@/components/LrcUploadForm';
import Link from 'next/link';

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-6">
          <Link href="/" className="text-sm text-purple-700 hover:text-purple-800">
            ← Retour à l&apos;accueil
          </Link>
        </div>
        <div className="max-w-4xl mx-auto">
          <LrcUploadForm />
        </div>
      </div>
    </div>
  );
}
