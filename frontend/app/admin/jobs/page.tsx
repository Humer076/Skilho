'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminShell from '../components/AdminShell';
import { adminFetch } from '../components/adminApi';
import { adminFetchList } from '../components/listApi';
import { fmtDate, nice } from '../components/ListPage';

type Row = {
  id: string;
  title: string;
  category: string;
  city: string;
  state: string;
  status: string;
  vacancies: number;
  createdAt: string;
  employerProfile: { companyName: string };
  _count: { applications: number };
};

const STATUSES = ['ACTIVE', 'DRAFT', 'CLOSED'] as const;

/* Premium status palette for jobs. */
const STATUS_STYLE: Record<string, { pill: string; dot: string }> = {
  ACTIVE: { pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  DRAFT: { pill: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  CLOSED: { pill: 'bg-slate-100 text-slate-600 ring-slate-300', dot: 'bg-slate-400' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.CLOSED;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${s.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {nice(status)}
    </span>
  );
}

function initials(name: string) {
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

  .ad-pill { transition: transform .2s ease, background-color .2s ease, color .2s ease, border-color .2s ease; }
  .ad-pill:hover { transform: translateY(-1px); }

  @media (prefers-reduced-motion: reduce) {
    .ad-up, .ad-pop, .ad-in, .ad-shimmer::after, .ad-spin { animation: none !important; opacity: 1 !important; }
    .ad-card:hover, .ad-tile:hover, .ad-pill:hover { transform: none; }
  }
`;

function Skeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-5" aria-label="Loading jobs">
      <div className="ad-shimmer h-9 w-48 rounded-xl bg-slate-200" />
      <div className="ad-shimmer h-24 rounded-2xl bg-slate-200" />
      <div className="ad-shimmer h-[520px] rounded-2xl bg-slate-200" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminJobsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('');
  const [busyId, setBusyId] = useState<string | null>(null);

  // TEMP DEBUG — remove once jobs render correctly
  const [debugRaw, setDebugRaw] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setDebugRaw('');
    try {
      const url = status
        ? `/admin/manage/jobs?status=${encodeURIComponent(status)}`
        : '/admin/manage/jobs';

      const list = await adminFetchList<Row>(url);
      setRows(list);

      // TEMP DEBUG — capture the raw shape if we got nothing back
      if (list.length === 0) {
        const raw = await adminFetch<unknown>(url);
        console.log('RAW jobs response:', raw);
        setDebugRaw(JSON.stringify(raw, null, 2).slice(0, 1500));
      }
    } catch (e) {
      setError((e as Error).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatusFor(row: Row, next: 'ACTIVE' | 'CLOSED') {
    setError('');
    setBusyId(row.id);
    try {
      await adminFetch(`/admin/manage/jobs/${row.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: next }),
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.title, r.category, r.employerProfile?.companyName, r.city, r.state]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, query]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of rows) map[r.status] = (map[r.status] ?? 0) + 1;
    return map;
  }, [rows]);

  return (
    <AdminShell>
      <style>{STYLES}</style>

      <div className="mx-auto max-w-7xl space-y-5">
        {/* ---------- Header ---------- */}
        <div className="ad-up flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-700 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
              Jobs
            </h1>
            <p className="mt-1 max-w-2xl text-slate-600">
              All jobs posted by employers. Close a job that should no longer be visible.
            </p>
          </div>
          {!loading && !error && (
            <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3.5 py-1.5 text-sm font-medium text-slate-600 shadow-sm backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {rows.length.toLocaleString('en-IN')} {rows.length === 1 ? 'job' : 'jobs'}
            </span>
          )}
        </div>

        {/* TEMP DEBUG BOX — remove once jobs render correctly */}
        {debugRaw && (
          <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-4 text-xs">
            <p className="mb-2 font-bold text-amber-900">
              DEBUG — raw response from /admin/manage/jobs:
            </p>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all font-mono text-amber-900">
              {debugRaw}
            </pre>
          </div>
        )}

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
          <>
            {/* ---------- Filters ---------- */}
            <section
              className="ad-card ad-up surface p-4 shadow-sm"
              style={{ animationDelay: '60ms' }}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-md">
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
                    placeholder="Search by title, category or company"
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

                <div className="flex items-center gap-2">
                  <label
                    htmlFor="status-filter"
                    className="text-xs font-semibold text-slate-500"
                  >
                    Status
                  </label>
                  <select
                    id="status-filter"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">All</option>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {nice(s)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* status legend */}
              {rows.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => setStatus('')}
                    className={`ad-pill inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      status === ''
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    All
                  </button>
                  {STATUSES.filter((s) => (counts[s] ?? 0) > 0).map((s) => {
                    const st = STATUS_STYLE[s];
                    const active = status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`ad-pill inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          active
                            ? `${st.pill} border-transparent shadow-sm`
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        {nice(s)}
                        <span className="tabular-nums opacity-70">{counts[s]}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ---------- Table ---------- */}
            <section
              className="ad-up overflow-hidden rounded-xl ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(12,16,19,.04),0_10px_28px_-14px_rgba(15,88,112,.14)] bg-white shadow-sm"
              style={{ animationDelay: '120ms' }}
            >
              <div className="overflow-x-auto">
                <table className="ad-table w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Job</th>
                      <th className="px-5 py-3">Company</th>
                      <th className="px-5 py-3">Location</th>
                      <th className="px-5 py-3 text-center">Vacancies</th>
                      <th className="px-5 py-3 text-center">Applications</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Posted</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visible.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-5 py-16 text-center">
                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                              <path d="M3 7h18v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Zm6 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <p className="font-semibold text-slate-900">
                            {query || status ? 'No matching jobs' : 'No jobs yet'}
                          </p>
                          <p className="mt-1 text-slate-500">
                            {query || status
                              ? 'Try a different search, status or clear the filters.'
                              : 'Jobs posted by employers will appear here.'}
                          </p>
                          {(query || status) && (
                            <button
                              onClick={() => {
                                setQuery('');
                                setStatus('');
                              }}
                              className="ad-tile mt-4 rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Clear filters
                            </button>
                          )}
                        </td>
                      </tr>
                    )}

                    {visible.map((r, i) => {
                      const isActive = r.status === 'ACTIVE';
                      const busy = busyId === r.id;
                      return (
                        <tr
                          key={r.id}
                          className="ad-up"
                          style={{ animationDelay: `${140 + i * 30}ms` }}
                        >
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900">{r.title}</p>
                            <p className="text-xs text-slate-500">{r.category}</p>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            <div className="flex items-center gap-2">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-slate-100 to-slate-200 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">
                                {initials(r.employerProfile?.companyName ?? '')}
                              </span>
                              <span className="truncate">{r.employerProfile?.companyName ?? '—'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {[r.city, r.state].filter(Boolean).join(', ') || '—'}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex min-w-[1.75rem] justify-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-700">
                              {r.vacancies}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex min-w-[1.75rem] justify-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-indigo-700 ring-1 ring-indigo-100">
                              {r._count?.applications ?? 0}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                            {fmtDate(r.createdAt)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setStatusFor(r, isActive ? 'CLOSED' : 'ACTIVE')}
                              disabled={busy}
                              className={`ad-tile inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                isActive
                                  ? 'border-slate-300 bg-white text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100'
                              }`}
                            >
                              {busy ? (
                                <svg className="ad-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                                  <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                                </svg>
                              ) : isActive ? (
                                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                                  <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                              {isActive ? 'Close' : 'Set active'}
                            </button>
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
                  {rows.length === 1 ? 'job' : 'jobs'}
                  {status && (
                    <>
                      {' '}· filtered by{' '}
                      <span className="font-semibold text-slate-700">{nice(status)}</span>
                    </>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AdminShell>
  );
}