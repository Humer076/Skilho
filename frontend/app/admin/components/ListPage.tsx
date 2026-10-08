'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminShell from './AdminShell';
import { adminFetch } from './adminApi';

export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const nice = (s: string) => s.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export const expText = (months?: number | null) =>
  months == null ? '—' : `${Math.floor(months / 12)}y ${months % 12}m`;

const GOOD = ['APPROVED', 'ACTIVE', 'SELECTED', 'HIRED', 'SHORTLISTED'];
const BAD = ['REJECTED', 'SUSPENDED', 'CLOSED'];
const WAIT = ['UNDER_REVIEW', 'PENDING_VERIFICATION', 'REGISTRATION_SUBMITTED', 'DRAFT'];

export function StatusBadge({ status }: { status: string }) {
  const cls = GOOD.includes(status) ? 'badge-success'
    : BAD.includes(status) ? 'badge-danger'
    : WAIT.includes(status) ? 'badge-warning'
    : status === 'APPLIED' || status === 'INTERVIEW_SCHEDULED' ? 'badge-info'
    : 'badge-neutral';
  return <span className={`badge ${cls}`}>{nice(status)}</span>;
}

export type Col<T> = { header: string; cell: (row: T, reload: () => void) => React.ReactNode };

type Paged<T> = { items: T[]; total: number; page: number; totalPages: number };

type Props<T> = {
  title: string;
  subtitle: string;
  endpoint: string;
  columns: Col<T>[];
  searchPlaceholder?: string;
  filter?: { param: string; label: string; options: { value: string; label: string }[] };
  toolbar?: (reload: () => void) => React.ReactNode;
  noun?: string;
};

export default function ListPage<T extends { id: string }>({
  title, subtitle, endpoint, columns, searchPlaceholder = 'Search', filter, toolbar, noun = 'results',
}: Props<T>) {
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [filterVal, setFilterVal] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (q) params.set('q', q);
    if (filter && filterVal) params.set(filter.param, filterVal);

    adminFetch<Paged<T>>(`${endpoint}?${params.toString()}`)
      .then((d) => { if (!cancelled) { setData(d); setError(''); } })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [endpoint, q, filter?.param, filterVal, page, tick]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQ(input.trim());
  }

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
            <p className="text-slate-600 mt-1">{subtitle}</p>
          </div>
          {toolbar?.(reload)}
        </div>

        <form onSubmit={onSearch} className="surface p-4 flex flex-col sm:flex-row gap-3">
          <label className="flex-1">
            <span className="sr-only">Search</span>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={searchPlaceholder} className="input-premium" />
          </label>
          {filter && (
            <label className="sm:w-56">
              <span className="sr-only">{filter.label}</span>
              <select value={filterVal} onChange={(e) => { setFilterVal(e.target.value); setPage(1); }} className="input-premium">
                <option value="">{filter.label}: All</option>
                {filter.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          )}
          <button type="submit" className="btn-primary">Search</button>
          {(q || filterVal) && (
            <button type="button" className="btn-secondary" onClick={() => { setInput(''); setQ(''); setFilterVal(''); setPage(1); }}>
              Clear
            </button>
          )}
        </form>

        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">{error}</p>}

        <section className={`surface overflow-hidden transition-opacity ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
          {data && data.items.length === 0 ? (
            <p className="text-center text-slate-500 py-14">{loading ? 'Loading...' : `No ${noun} found.`}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-premium">
                <thead><tr>{columns.map((c) => <th key={c.header}>{c.header}</th>)}</tr></thead>
                <tbody>
                  {(data?.items ?? []).map((row) => (
                    <tr key={row.id}>{columns.map((c) => <td key={c.header}>{c.cell(row, reload)}</td>)}</tr>
                  ))}
                  {!data && <tr><td colSpan={columns.length} className="text-center text-slate-500 py-14">Loading...</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {data && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <p><span className="font-bold text-slate-900">{data.total}</span> {noun}</p>
            {data.totalPages > 1 && (
              <div className="flex items-center gap-3">
                <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary !py-1.5 disabled:opacity-40">← Previous</button>
                <span>Page {data.page} of {data.totalPages}</span>
                <button type="button" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)} className="btn-secondary !py-1.5 disabled:opacity-40">Next →</button>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}