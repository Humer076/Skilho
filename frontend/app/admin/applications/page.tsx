'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminShell from '../components/AdminShell';
import { adminFetch } from '../components/adminApi';
import { adminFetchList } from '../components/listApi';
import { fmtDate, nice } from '../components/ListPage';

type Row = {
  id: string;
  status: string;
  createdAt: string;
  jobTitle: string;
  company: string;
  applicant: string;
};

const STATUSES = [
  'APPLIED',
  'UNDER_REVIEW',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'SELECTED',
  'REJECTED',
  'WITHDRAWN',
  'HIRED',
] as const;

/* Premium status palette — one entry per status, mirrored for the legend. */
const STATUS_STYLE: Record<string, { pill: string; dot: string }> = {
  APPLIED: { pill: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
  UNDER_REVIEW: { pill: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  SHORTLISTED: { pill: 'bg-violet-50 text-violet-700 ring-violet-200', dot: 'bg-violet-500' },
  INTERVIEW_SCHEDULED: { pill: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-500' },
  SELECTED: { pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  HIRED: { pill: 'bg-teal-50 text-teal-700 ring-teal-200', dot: 'bg-teal-500' },
  REJECTED: { pill: 'bg-rose-50 text-rose-700 ring-rose-200', dot: 'bg-rose-500' },
  WITHDRAWN: { pill: 'bg-slate-100 text-slate-600 ring-slate-300', dot: 'bg-slate-400' },
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

  .ad-pill { transition: transform .2s ease, background-color .2s ease, color .2s ease, border-color .2s ease; }
  .ad-pill:hover { transform: translateY(-1px); }

  @media (prefers-reduced-motion: reduce) {
    .ad-up, .ad-pop, .ad-in, .ad-shimmer::after { animation: none !important; opacity: 1 !important; }
    .ad-card:hover, .ad-tile:hover, .ad-pill:hover { transform: none; }
  }
`;

/* ------------------------------------------------------------------ */
/*  Building blocks                                                    */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.APPLIED;
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
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '—';
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-5" aria-label="Loading applications">
      <div className="ad-shimmer h-9 w-64 rounded-xl bg-slate-200" />
      <div className="ad-shimmer h-24 rounded-2xl bg-slate-200" />
      <div className="ad-shimmer h-[520px] rounded-2xl bg-slate-200" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminApplicationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('');

  // TEMP DEBUG — remove once applications render correctly
  const [debugRaw, setDebugRaw] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setDebugRaw('');
    try {
      const url = status
        ? `/admin/manage/applications?status=${encodeURIComponent(status)}`
        : '/admin/manage/applications';

      const list = await adminFetchList<Row>(url);
      setRows(list);

      // TEMP DEBUG — capture the raw shape if we got nothing back
      if (list.length === 0) {
        const raw = await adminFetch<unknown>(url);
        console.log('RAW applications response:', raw);
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

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.jobTitle, r.company, r.applicant]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, query]);

  /* Counts for the status legend chips. */
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
              Applications
            </h1>
            <p className="mt-1 text-slate-600">
              Every application technicians have sent to jobs.
            </p>
          </div>
          {!loading && !error && (
            <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3.5 py-1.5 text-sm font-medium text-slate-600 shadow-sm backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {rows.length.toLocaleString('en-IN')}{' '}
              {rows.length === 1 ? 'application' : 'applications'}
            </span>
          )}
        </div>

        {/* TEMP DEBUG BOX — remove once applications render correctly */}
        {debugRaw && (
          <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-4 text-xs">
            <p className="mb-2 font-bold text-amber-900">
              DEBUG — raw response from /admin/manage/applications:
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
            {/* ---------- Filters row ---------- */}
            <section
              className="ad-card ad-up surface p-4 shadow-sm"
              style={{ animationDelay: '60ms' }}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* search */}
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
                    placeholder="Search by job, company or applicant"
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

                {/* status select */}
                <div className="flex items-center gap-2">
                  <label htmlFor="status-filter" className="text-xs font-semibold text-slate-500">
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
                      <th className="px-5 py-3">Job title</th>
                      <th className="px-5 py-3">Company</th>
                      <th className="px-5 py-3">Applicant</th>
                      <th className="px-5 py-3">Applied at</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visible.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-16 text-center">
                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                              <path d="M9 12h6m-6 4h6M5 3h11l3 3v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <p className="font-semibold text-slate-900">
                            {query || status ? 'No matching applications' : 'No applications yet'}
                          </p>
                          <p className="mt-1 text-slate-500">
                            {query || status
                              ? 'Try a different search, status or clear the filters.'
                              : 'Applications from technicians will appear here.'}
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

                    {visible.map((r, i) => (
                      <tr
                        key={r.id}
                        className="ad-up"
                        style={{ animationDelay: `${140 + i * 30}ms` }}
                      >
                        <td className="px-5 py-4">
                          <span className="font-semibold text-slate-900">{r.jobTitle}</span>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-slate-100 to-slate-200 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">
                              {initials(r.company)}
                            </span>
                            <span className="truncate">{r.company}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-indigo-50 to-violet-100 text-[10px] font-bold text-indigo-700 ring-1 ring-indigo-100">
                              {initials(r.applicant)}
                            </span>
                            <span className="truncate text-slate-700">{r.applicant}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {fmtDate(r.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {visible.length > 0 && (
                <div className="border-t border-slate-200 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
                  Showing <span className="font-semibold text-slate-700">{visible.length}</span> of{' '}
                  <span className="font-semibold text-slate-700">{rows.length}</span>{' '}
                  {rows.length === 1 ? 'application' : 'applications'}
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