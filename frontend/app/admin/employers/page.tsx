'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminFetchList } from '../components/listApi';
import Link from 'next/link';
import AdminShell from '../components/AdminShell';
import { adminFetch } from '../components/adminApi';
import { fmtDate, nice } from '../components/ListPage';

type Row = {
  id: string;
  companyName: string;
  city: string | null;
  state: string | null;
  verificationStatus: string;
  createdAt: string;
  user: { email: string | null; mobile: string | null };
  _count: { jobs: number; documents: number };
};

/** Possible shapes the backend might return for a list endpoint. */
type Paged<T> = {
  items?: T[];
  data?: T[];
  results?: T[];
  rows?: T[];
  records?: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  limit?: number;
};

/** Normalize any of the common list response shapes into a plain array. */
function extractList<T>(raw: T[] | Paged<T> | null | undefined): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  const candidates = [raw.items, raw.data, raw.results, raw.rows, raw.records];
  for (const c of candidates) if (Array.isArray(c)) return c;
  return [];
}

const STATUSES = [
  'REGISTRATION_SUBMITTED',
  'PENDING_VERIFICATION',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'SUSPENDED',
] as const;

/* Premium status palette for employer verification. */
const STATUS_STYLE: Record<string, { pill: string; dot: string }> = {
  REGISTRATION_SUBMITTED: { pill: 'bg-slate-100 text-slate-700 ring-slate-300', dot: 'bg-slate-400' },
  PENDING_VERIFICATION: { pill: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  UNDER_REVIEW: { pill: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
  APPROVED: { pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { pill: 'bg-rose-50 text-rose-700 ring-rose-200', dot: 'bg-rose-500' },
  SUSPENDED: { pill: 'bg-slate-100 text-slate-700 ring-slate-400', dot: 'bg-slate-500' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.PENDING_VERIFICATION;
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

  .ad-pill { transition: transform .2s ease, background-color .2s ease, color .2s ease, border-color .2s ease; }
  .ad-pill:hover { transform: translateY(-1px); }

  @media (prefers-reduced-motion: reduce) {
    .ad-up, .ad-pop, .ad-in, .ad-shimmer::after { animation: none !important; opacity: 1 !important; }
    .ad-card:hover, .ad-tile:hover, .ad-pill:hover { transform: none; }
  }
`;

function Skeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-5" aria-label="Loading employers">
      <div className="ad-shimmer h-9 w-56 rounded-xl bg-slate-200" />
      <div className="ad-shimmer h-24 rounded-2xl bg-slate-200" />
      <div className="ad-shimmer h-[520px] rounded-2xl bg-slate-200" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminEmployersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const url = status
        ? `/admin/manage/employers?status=${encodeURIComponent(status)}`
        : '/admin/manage/employers';

      const list = await adminFetchList<Row>(url);
setRows(list);
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

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.companyName, r.city, r.state, r.user?.email, r.user?.mobile]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, query]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of rows) map[r.verificationStatus] = (map[r.verificationStatus] ?? 0) + 1;
    return map;
  }, [rows]);

  return (
    <AdminShell>
      <style>{STYLES}</style>

      <div className="mx-auto max-w-7xl space-y-5">
        {/* ---------- Header ---------- */}
        <div className="ad-up flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-700 bg-clip-text text-2xl font-bold leading-tight tracking-tight text-transparent">
              Employers
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-600">
              Companies that hire on Skilho. Open Company Verification to review documents.
            </p>
          </div>
          {!loading && !error && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 font-medium text-slate-600 shadow-sm backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {rows.length.toLocaleString('en-IN')}{' '}
                {rows.length === 1 ? 'employer' : 'employers'}
              </span>
              <Link
                href="/admin/companies"
                className="ad-tile inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 font-semibold text-indigo-700 shadow-sm hover:border-indigo-300 hover:bg-indigo-100"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                  <path d="m9 12 2 2 4-4M12 3 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Company verification
              </Link>
            </div>
          )}
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
              onClick={load}
              className="ad-tile shrink-0 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              Try again
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
                    placeholder="Search by company, city, email or mobile"
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
                      <th className="px-5 py-3">Company</th>
                      <th className="px-5 py-3">Contact</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-center">Jobs</th>
                      <th className="px-5 py-3 text-center">Documents</th>
                      <th className="px-5 py-3">Registered</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visible.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-16 text-center">
                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                              <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <p className="font-semibold text-slate-900">
                            {query || status ? 'No matching employers' : 'No employers yet'}
                          </p>
                          <p className="mt-1 text-slate-500">
                            {query || status
                              ? 'Try a different search, status or clear the filters.'
                              : 'Employers will appear here once they register.'}
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
                      const location = [r.city, r.state].filter(Boolean).join(', ');
                      return (
                        <tr
                          key={r.id}
                          className="ad-up"
                          style={{ animationDelay: `${140 + i * 30}ms` }}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-violet-100 text-xs font-bold text-indigo-700 ring-1 ring-indigo-100">
                                {initials(r.companyName)}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">{r.companyName}</p>
                                <p className="truncate text-xs text-slate-500">
                                  {location || '—'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-slate-700">{r.user?.email || '—'}</p>
                            <p className="text-xs text-slate-500">{r.user?.mobile || ''}</p>
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={r.verificationStatus} />
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex min-w-[1.75rem] justify-center rounded-md bg-sky-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-sky-700 ring-1 ring-sky-100">
                              {r._count?.jobs ?? 0}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex min-w-[1.75rem] justify-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-700">
                              {r._count?.documents ?? 0}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                            {fmtDate(r.createdAt)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Link
                              href="/admin/companies"
                              className="ad-tile inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                            >
                              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                              </svg>
                              Review
                            </Link>
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
                  {rows.length === 1 ? 'employer' : 'employers'}
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
