'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminShell from '../components/AdminShell';
import { adminFetch } from '../components/adminApi';
import { adminFetchList } from '../components/listApi';
import { fmtDate, nice } from '../components/ListPage';

type Row = {
  id: string;
  organization: string;
  position: string;
  stage: string;
  employmentType: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  employeeProfile: { fullName: string | null };
};

/* ------------------------------------------------------------------ */
/*  Motion / polish layer (visual only — no logic)                     */
/* ------------------------------------------------------------------ */
const STYLES = `
  @keyframes adUp   { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes adIn   { from { opacity: 0; } to { opacity: 1; } }
  @keyframes adPop  { from { opacity: 0; transform: translateY(14px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes adShimmer { 100% { transform: translateX(100%); } }

  .ad-up   { animation: adUp .6s cubic-bezier(.22,.61,.36,1) both; }
  .ad-pop  { animation: adPop .45s cubic-bezier(.22,.61,.36,1) both; }
  .ad-in   { animation: adIn .8s ease both; }

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

  .ad-link-arrow { transition: transform .2s ease; }
  .ad-link:hover .ad-link-arrow { transform: translateX(-4px); }

  @media (prefers-reduced-motion: reduce) {
    .ad-up, .ad-pop, .ad-in, .ad-shimmer::after { animation: none !important; opacity: 1 !important; }
    .ad-card:hover, .ad-tile:hover { transform: none; }
  }
`;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/** Deterministic soft colour per string so pills look distinct but consistent. */
const PILL_COLORS = [
  'bg-sky-50 text-sky-700 ring-sky-200',
  'bg-indigo-50 text-indigo-700 ring-indigo-200',
  'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'bg-amber-50 text-amber-800 ring-amber-200',
  'bg-rose-50 text-rose-700 ring-rose-200',
  'bg-violet-50 text-violet-700 ring-violet-200',
  'bg-teal-50 text-teal-700 ring-teal-200',
];

function pillColor(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return PILL_COLORS[h % PILL_COLORS.length];
}

function Pill({ value }: { value: string }) {
  if (!value) return <span className="text-slate-400">—</span>;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${pillColor(value)}`}>
      {nice(value)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Building blocks                                                    */
/* ------------------------------------------------------------------ */

function Skeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-5" aria-label="Loading career journey">
      <div className="ad-shimmer h-9 w-64 rounded-xl bg-slate-200" />
      <div className="ad-shimmer h-14 rounded-2xl bg-slate-200" />
      <div className="ad-shimmer h-[520px] rounded-2xl bg-slate-200" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminCareerJourneyPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  // TEMP DEBUG — remove once career entries render correctly
  const [debugRaw, setDebugRaw] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setDebugRaw('');
    try {
      const list = await adminFetchList<Row>('/admin/manage/career');
      setRows(list);

      // TEMP DEBUG — capture the raw shape if we got nothing back
      if (list.length === 0) {
        const raw = await adminFetch<unknown>('/admin/manage/career');
        console.log('RAW career response:', raw);
        setDebugRaw(JSON.stringify(raw, null, 2).slice(0, 1500));
      }
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
        r.employeeProfile?.fullName,
        r.organization,
        r.position,
        r.location,
        r.stage,
        r.employmentType,
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
              Career journey
            </h1>
            <p className="mt-1 text-slate-600">
              Work and training history that technicians have added to their profiles.
            </p>
          </div>
          {!loading && !error && (
            <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3.5 py-1.5 text-sm font-medium text-slate-600 shadow-sm backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {rows.length.toLocaleString('en-IN')} {rows.length === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>

        {/* TEMP DEBUG BOX — remove once career entries render correctly */}
        {debugRaw && (
          <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-4 text-xs">
            <p className="mb-2 font-bold text-amber-900">
              DEBUG — raw response from /admin/manage/career:
            </p>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all font-mono text-amber-900">
              {debugRaw}
            </pre>
          </div>
        )}

        {error && (
          <div role="alert" className="ad-pop flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
            <span className="flex items-start gap-2">
              <span aria-hidden>⚠️</span> {error}
            </span>
            <button
              onClick={load}
              className="ad-tile shrink-0 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              Try again
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
                  placeholder="Search by technician, organization or position"
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
                  <>Showing all {rows.length.toLocaleString('en-IN')} entries</>
                )}
              </p>
            </div>

            {/* ---------- Table ---------- */}
            <div className="overflow-x-auto">
              <table className="ad-table w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Technician</th>
                    <th className="px-5 py-3">Position</th>
                    <th className="px-5 py-3">Stage</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Period</th>
                    <th className="px-5 py-3">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                            <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </div>
                        <p className="font-semibold text-slate-900">
                          {query ? 'No matching entries' : 'No career entries yet'}
                        </p>
                        <p className="mt-1 text-slate-500">
                          {query
                            ? 'Try a different name, organization or position.'
                            : 'Technician work history will appear here once they add it.'}
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
                    const name = r.employeeProfile?.fullName || 'Not provided';
                    return (
                      <tr
                        key={r.id}
                        className="ad-up"
                        style={{ animationDelay: `${100 + i * 30}ms` }}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-violet-100 text-xs font-bold text-indigo-700 ring-1 ring-indigo-100">
                              {name === 'Not provided' ? '—' : initials(name)}
                            </span>
                            <span className={`font-semibold ${name === 'Not provided' ? 'text-slate-400' : 'text-slate-900'}`}>
                              {name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-900">{r.position || '—'}</p>
                          <p className="text-xs text-slate-500">{r.organization || '—'}</p>
                        </td>
                        <td className="px-5 py-4">
                          <Pill value={r.stage} />
                        </td>
                        <td className="px-5 py-4">
                          <Pill value={r.employmentType} />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {fmtDate(r.startDate)} –{' '}
                          {r.endDate ? (
                            fmtDate(r.endDate)
                          ) : (
                            <span className="font-semibold text-emerald-700">Present</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {r.location || <span className="text-slate-400">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ---------- Footer ---------- */}
            {visible.length > 0 && (
              <div className="border-t border-slate-200 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-700">{visible.length}</span> of{' '}
                <span className="font-semibold text-slate-700">{rows.length}</span>{' '}
                {rows.length === 1 ? 'entry' : 'entries'}
              </div>
            )}
          </section>
        )}
      </div>
    </AdminShell>
  );
}