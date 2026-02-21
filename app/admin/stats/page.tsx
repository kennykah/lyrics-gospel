'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { fetchAdminSongStats } from '@/lib/supabaseData';
import type { AdminSongStatsRow } from '@/types';

export default function AdminStatsPage() {
  return (
    <AuthGuard requireAdmin>
      <AdminStatsContent />
    </AuthGuard>
  );
}

function AdminStatsContent() {
  const [rows, setRows] = useState<AdminSongStatsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error: statsError } = await fetchAdminSongStats(200);
      if (statsError) {
        setError(statsError.message || 'Impossible de charger les statistiques.');
        setLoading(false);
        return;
      }
      setRows((data as AdminSongStatsRow[]) || []);
      setLoading(false);
    };

    load();
  }, []);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.visits += Number(row.visit_count || 0);
        acc.plays += Number(row.play_count || 0);
        return acc;
      },
      { visits: 0, plays: 0 }
    );
  }, [rows]);

  return (
    <div className="min-h-screen bg-[--background] pt-[52px]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-[--text-tertiary] hover:text-[--text-secondary] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Retour
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-[-0.02em] text-[--text-primary]">Stats admin</h1>
          <p className="text-[--text-secondary] text-[14px] mt-1.5">Suivi des visites de page et des lectures audio par chanson.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="card-apple p-5">
            <p className="text-[12px] uppercase tracking-wider text-[--text-tertiary]">Visites totales</p>
            <p className="text-3xl font-semibold text-[--text-primary] mt-2">{totals.visits}</p>
          </div>
          <div className="card-apple p-5">
            <p className="text-[12px] uppercase tracking-wider text-[--text-tertiary]">Lectures totales</p>
            <p className="text-3xl font-semibold text-[--text-primary] mt-2">{totals.plays}</p>
          </div>
        </div>

        <div className="card-apple overflow-hidden">
          {loading ? (
            <div className="p-8 text-[14px] text-[--text-secondary]">Chargement des statistiques...</div>
          ) : error ? (
            <div className="p-8 text-[14px] text-red-500">{error}</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-[14px] text-[--text-secondary]">Aucune donnée disponible pour le moment.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[680px]">
                <thead>
                  <tr className="border-b border-black/[0.06]">
                    <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-[--text-tertiary]">Chanson</th>
                    <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-[--text-tertiary]">Artiste</th>
                    <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-[--text-tertiary]">Visites</th>
                    <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-[--text-tertiary]">Lectures</th>
                    <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-[--text-tertiary]">Voir</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.song_id} className="border-b border-black/[0.04] last:border-0">
                      <td className="px-4 py-3 text-[14px] text-[--text-primary] font-medium">{row.title}</td>
                      <td className="px-4 py-3 text-[14px] text-[--text-secondary]">{row.artist_name}</td>
                      <td className="px-4 py-3 text-[14px] text-[--text-primary]">{Number(row.visit_count || 0)}</td>
                      <td className="px-4 py-3 text-[14px] text-[--text-primary]">{Number(row.play_count || 0)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/songs/${row.song_id}`} className="text-[13px] text-[--accent] hover:underline">
                          Ouvrir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
