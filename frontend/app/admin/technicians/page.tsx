'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminFetchList } from '../components/listApi';
import AdminShell from '../components/AdminShell';
import { expText, fmtDate } from '../components/ListPage';

type Row = {
  id: string;
  fullName: string | null;
  professionalTitle: string | null;
  currentCity: string | null;
  currentState: string | null;
  totalExperienceMonths: number | null;
  verified: boolean;
  createdAt: string;
  user: { email: string | null; mobile: string | null };
  _count: { skills: number; applications: number };
};

function initials(name: string | null) {
  if (!name) return '—';
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '—'
  );
}

/* ------------------------------------------------------------------ */
/*  Motion / polish layer (visual only — no logic)                     */
/* ------------------------------------------------------------------ */
const STYLES = `
  @keyframes adUp   { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes adIn   { from { opacity: 0; } to { opacity: 1; } }
  @keyframes adPop  { from { opacity: 0; transform: translateY(14px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes adShimmer { 100% { transform: translateX(100%); } }
  @keyframes adSpin { to { transform: rotate(360deg); } }

  .ad-up   { animation: adUp .6s cubic-bezier(.22,.61,.36,1) both; }
  .ad-pop  { animation: adPop .45s cubic-bezier(.22,.61,.36,1) both; }
  .ad-in   { animation: adIn .8s ease both; }
  .ad-spin { animation: adSpin .8s linear infinite; }

  .ad-card { transition: transform .3s cubic-bezier(.22,.61,.36,1), box-shadow .3s ease, border-color .3s ease; }
  .ad-card:hover { transform: translateY(-3px); }

  .ad-shimmer { position: relative; overflow: hidden; }
  .ad-shimmer::after {
    content: ''; position: absolute; inset: 0; transform: translateX(-100%);
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.75), transparent);
    animation: adShimmer 1.5s infinite;
  }

  .ad-table tbody tr { transition: background-color .18s ease; }
  .ad-table tbody tr:hover { background-color: #f8fafc; }

  .ad-tile { transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease, background-color .2s ease, color .2s ease; }
  .ad-tile:hover { transform: translateY(-1px) scale(1.03); }

  @media (prefers-reduced-motion: reduce) {
    .ad-up, .ad-pop, .ad-in, .ad-shimmer::after, .ad-spin { animation: none !important; opacity: 1 !important; }
    .ad-card:hover, .ad-tile:hover { transform: none; }
  }
`;

function Skeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-5" aria-label="Loading technicians">
      <div className="ad-shimmer h-9 w-56 rounded-xl bg-slate-200" />
      <div className="ad-shimmer h-20 rounded-2xl bg-slate-200" />
      <div className="ad-shimmer h-[520px] rounded-2xl bg-slate-200" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminTechniciansPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await adminFetchList<Row>('/admin/manage/technicians');
      setRows(list);

    } catch (e) {
      setError((e as Error).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);


  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.fullName,
        r.professionalTitle,
        r.currentCity,
        r.currentState,
        r.user?.email,
        r.user?.mobile,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, query]);


  return (
    <AdminShell>
      <style>{STYLES}</style>

      <div className="mx-auto max-w-7xl space-y-5">
        {/* ---------- Header ---------- */}
        <div className="ad-up flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-700 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
              Technicians
            </h1>
            <p className="mt-1 max-w-2xl text-slate-600">
              Technician directory and activity overview. Review profile details and application activity here; document review is handled in the relevant records.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="ad-pop flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm"
          >
            <span className="flex items-start gap-2">
              <span aria-hidden>⚠️</span> {error}
            </span>
            <button
              onClick={() => setError('')}
              className="ad-tile shrink-0 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              Dismiss
            </button>
          </div>
        )}

        {loading && !error && <Skeleton />}

        {!loading && !error && (
          <section
            className="ad-up overflow-hidden rounded-xl ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(12,16,19,.04),0_10px_28px_-14px_rgba(15,88,112,.14)] bg-white shadow-sm"
            style={{ animationDelay: '80ms' }}
          >
            {/* ---------- Search bar ---------- */}
            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-md">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="9" cy="9" r="6" />
                  <path d="M14 14l4 4" strokeLinecap="round" />
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, title, city, email or mobile"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="ad-tile absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-0.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-xs font-medium text-slate-500">
                {query ? (
                  <>
                    <span className="font-semibold text-slate-700">{visible.length}</span> of{' '}
                    <span className="font-semibold text-slate-700">{rows.length}</span> match
                  </>
                ) : (
                  <>Showing all {rows.length.toLocaleString('en-IN')} technicians</>
                )}
              </p>
            </div>

            {/* ---------- Table ---------- */}
            <div className="overflow-x-auto">
              <table className="ad-table w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Technician</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">City</th>
                    <th className="px-5 py-3">Experience</th>
                    <th className="px-5 py-3 text-center">Skills</th>
                    <th className="px-5 py-3 text-center">Applications</th>
                    <th className="px-5 py-3">Joined</th>
                    
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                            <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <p className="font-semibold text-slate-900">
                          {query ? 'No matching technicians' : 'No technicians yet'}
                        </p>
                        <p className="mt-1 text-slate-500">
                          {query
                            ? 'Try a different name, title, city or contact.'
                            : 'Technician profiles will appear here as they sign up.'}
                        </p>
                        {query && (
                          <button
                            onClick={() => setQuery('')}
                            className="ad-tile mt-4 rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Clear search
                          </button>
                        )}
                      </td>
                    </tr>
                  )}

                  {visible.map((r, i) => {
                    const name = r.fullName || 'Profile not completed';
                    const location = [r.currentCity, r.currentState].filter(Boolean).join(', ');
                    return (
                      <tr
                        key={r.id}
                        className="ad-up"
                        style={{ animationDelay: `${100 + i * 30}ms` }}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-violet-100 text-xs font-bold text-indigo-700 ring-1 ring-indigo-100">
                              {initials(r.fullName)}
                            </span>
                            <div className="min-w-0">
                              <p className={`truncate font-semibold ${r.fullName ? 'text-slate-900' : 'text-slate-400'}`}>
                                {name}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {r.professionalTitle || '—'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-slate-700">{r.user?.email || '—'}</p>
                          <p className="text-xs text-slate-500">{r.user?.mobile || ''}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {location || <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {expText(r.totalExperienceMonths)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex min-w-[1.75rem] justify-center rounded-md bg-violet-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-violet-700 ring-1 ring-violet-100">
                            {r._count?.skills ?? 0}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex min-w-[1.75rem] justify-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-indigo-700 ring-1 ring-indigo-100">
                            {r._count?.applications ?? 0}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {fmtDate(r.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {visible.length > 0 && (
              <div className="border-t border-slate-200 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-700">{visible.length}</span> of{' '}
                <span className="font-semibold text-slate-700">{rows.length}</span>{' '}
                {rows.length === 1 ? 'technician' : 'technicians'}
              </div>
            )}
          </section>
        )}
      </div>
    </AdminShell>
  );
}