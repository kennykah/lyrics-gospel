'use client';

import LrcUploadForm from '@/components/LrcUploadForm';
import AuthGuard from '@/components/AuthGuard';
import Link from 'next/link';

export default function UploadPage() {
  return (
    <AuthGuard>
    <div className="min-h-screen pt-[52px] bg-[--background]">
      <div className="max-w-[800px] mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-[--text-tertiary] hover:text-[--text-secondary] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Retour à l&#39;accueil
          </Link>
        </div>

        <LrcUploadForm />
      </div>
    </div>
    </AuthGuard>
  );
}
