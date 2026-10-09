'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const TOKEN_KEY = 'skilho_admin_token';

const FILTERS = [
  'ALL',
  'PENDING_VERIFICATION',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'SUSPENDED',
];

type Row = {
  id: string;
  companyName: string;
  city: string | null;
  state: string | null;
  verificationStatus: string;
  createdAt: string;
  user: { email: string | null; mobile: string | null };
  _count: { documents: number };
};

const STATUS_STYLE: Record<string, { pill: string; dot: string }> = {
  APPROVED: { pill: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  REJECTED: { pill: 'bg-rose-50 text-rose-700 ring-rose-600/20', dot: 'bg-rose-500' },
  SUSPENDED: { pill: 'bg-slate-100 text-slate-700 ring-slate-500/20', dot: 'bg-slate-500' },
  UNDER_REVIEW: { pill: 'bg-sky-50 text-sky-700 ring-sky-600/20', dot: 'bg-sky-500' },
  PENDING_VERIFICATION: { pill: 'bg-amber-50 text-amber-800 ring-amber-600/20', dot: 'bg-amber-500' },
};

function label(status: string) {
  if (status === 'ALL') return 'All';
  const text = status.replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.PENDING_VERIFICATION;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${s.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {label(status)}
    </span>
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
    .ad-tile:hover { transform: none; }
  }
`;

export default function AdminCompaniesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      router.replace('/admin/login');
      return;
    }

    fetch(`${API}/admin/employers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem(TOKEN_KEY);
          router.replace('/admin/login');
          throw new Error('Not allowed');
        }
        if (!res.ok) throw new Error('Could not load companies');
        return res.json();
      })
      .then((data: Row[]) => {
        setRows(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.message !== 'Not allowed') {
          setError(err.message);
          setLoading(false);
        }
      });
  }, [router]);

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    router.replace('/admin/login');
  }

  const count = (s: string) =>
    s === 'ALL' ? rows.length : rows.filter((r) => r.verificationStatus === s).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== 'ALL' && r.verificationStatus !== filter) return false;
      if (!q) return true;
      return [r.companyName, r.user.email, r.user.mobile, r.city, r.state]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, filter, query]);

  const summary = [
    { name: 'Total employers', value: count('ALL'), dot: 'bg-slate-400', grad: 'from-slate-400 to-slate-500' },
    { name: 'Pending approval', value: count('PENDING_VERIFICATION'), dot: 'bg-amber-500', grad: 'from-amber-500 to-orange-500' },
    { name: 'Under review', value: count('UNDER_REVIEW'), dot: 'bg-sky-500', grad: 'from-sky-500 to-blue-500' },
    { name: 'Verified', value: count('APPROVED'), dot: 'bg-emerald-500', grad: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 antialiased">
      <style>{STYLES}</style>

      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-md">
                S
              </span>
              <span className="text-base font-semibold tracking-tight">
                Skilho <span className="font-normal text-slate-500">Admin</span>
              </span>
            </div>
            <nav className="hidden items-center gap-1 sm:flex">
              <Link
                href="/admin/companies"
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-900"
              >
                Companies
              </Link>
              <Link
                href="/admin/packages"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Packages
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/packages"
              className="ad-tile rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:hidden"
            >
              Packages
            </Link>
            <button
              onClick={logout}
              className="ad-tile rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Back link */}
        <div className="ad-up mb-4 flex items-center gap-4 text-sm font-medium">
          <Link
            href="/admin/dashboard"
            className="ad-link ad-link-arrow inline-flex items-center gap-1.5 font-semibold text-brand-700 transition hover:text-brand-800"
          >
            <span className="ad-link-arrow">←</span> Back to dashboard
          </Link>
        </div>

        {/* Page title */}
        <div className="ad-up mb-6" style={{ animationDelay: '60ms' }}>
          <h1 className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-700 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            Employer verification
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review company documents and approve employers before they can post jobs.
          </p>
        </div>

        {/* Summary strip */}
        <section
          className="ad-up mb-8 grid grid-cols-2 overflow-hidden rounded-xl ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(12,16,19,.04),0_10px_28px_-14px_rgba(15,88,112,.14)] bg-white shadow-sm md:grid-cols-4 md:divide-x md:divide-slate-200"
          style={{ animationDelay: '120ms' }}
        >
          {summary.map((s, i) => (
            <div
              key={s.name}
              className={`group relative px-5 py-4 transition-colors hover:bg-slate-50/70 ${
                i < 2 ? 'border-b border-slate-200 md:border-b-0' : ''
              } ${i % 2 === 0 ? 'border-r border-slate-200 md:border-r-0' : ''}`}
            >
              <div className={`pointer-events-none absolute right-0 top-0 h-16 w-16 rounded-full bg-gradient-to-br ${s.grad} opacity-[0.06] blur-2xl transition-opacity group-hover:opacity-20`} />
              <div className="relative flex items-center gap-2 text-sm text-slate-500">
                <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                {s.name}
              </div>
              <p className="relative mt-2 text-3xl font-extrabold tabular-nums tracking-tight text-slate-900">
                {loading ? (
                  <span className="ad-shimmer inline-block h-8 w-12 rounded bg-slate-100" />
                ) : (
                  s.value
                )}
              </p>
            </div>
          ))}
        </section>

        {/* Table panel */}
        <section
          className="ad-up overflow-hidden rounded-xl ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(12,16,19,.04),0_10px_28px_-14px_rgba(15,88,112,.14)] bg-white shadow-sm"
          style={{ animationDelay: '180ms' }}
        >
          {/* Tabs + search */}
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 pt-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="-mb-px flex gap-1 overflow-x-auto">
              {FILTERS.map((f) => {
                const active = filter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      active
                        ? 'border-indigo-600 text-indigo-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {label(f)}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs tabular-nums transition ${
                        active ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count(f)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative pb-3 lg:w-72">
              <svg
                className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
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
                placeholder="Search company, email or city"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {error && (
            <div role="alert" className="ad-pop flex items-start gap-2 border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm font-medium text-rose-700">
              <span aria-hidden>⚠️</span>
              <span>{error}. Check that the API is running and reload the page.</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Registered</th>
                  <th className="px-5 py-3 text-center">Documents</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="ad-table divide-y divide-slate-100">
                {loading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-5 py-4">
                        <div
                          className="ad-shimmer h-5 rounded bg-slate-100"
                          style={{ animationDelay: `${i * 90}ms` }}
                        />
                      </td>
                    </tr>
                  ))}

                {!loading && visible.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                          <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <p className="font-semibold text-slate-900">No companies found</p>
                      <p className="mt-1 text-slate-500">
                        {query || filter !== 'ALL'
                          ? 'Try a different status or clear your search.'
                          : 'New employer registrations will appear here.'}
                      </p>
                    </td>
                  </tr>
                )}

                {!loading &&
                  visible.map((r, i) => (
                    <tr
                      key={r.id}
                      className="ad-up transition-colors hover:bg-slate-50/70"
                      style={{ animationDelay: `${i * 35}ms` }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 text-xs font-bold text-indigo-700 ring-1 ring-indigo-100">
                            {initials(r.companyName)}
                          </span>
                          <span className="font-semibold text-slate-900">{r.companyName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{r.user.email ?? r.user.mobile ?? '-'}</td>
                      <td className="px-5 py-4 text-slate-600">
                        {[r.city, r.state].filter(Boolean).join(', ') || '-'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(r.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex min-w-[1.75rem] justify-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-700">
                          {r._count.documents}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={r.verificationStatus} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/companies/${r.id}`}
                          className="ad-tile inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {!loading && visible.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700">{visible.length}</span> of{' '}
              <span className="font-semibold text-slate-700">{rows.length}</span> companies
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
