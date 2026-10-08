'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminShell from '../components/AdminShell';
import { adminFetchList } from '../components/listApi';
import { fmtDate, nice } from '../components/ListPage';

type Row = {
  id: string;
  name: string;
  email: string | null;
  mobile: string | null;
  role: string;
  createdAt: string;
};

const ROLES = [
  { value: 'EMPLOYEE', label: 'Technician' },
  { value: 'EMPLOYER', label: 'Employer' },
] as const;

/* Role palette — technicians get indigo, employers get amber. */
const ROLE_STYLE: Record<string, { pill: string; dot: string; avatar: string; icon: React.ReactNode }> = {
  EMPLOYEE: {
    pill: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    dot: 'bg-indigo-500',
    avatar: 'from-indigo-50 to-violet-100 text-indigo-700 ring-indigo-100',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  EMPLOYER: {
    pill: 'bg-amber-50 text-amber-800 ring-amber-200',
    dot: 'bg-amber-500',
    avatar: 'from-amber-50 to-orange-100 text-amber-800 ring-amber-100',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
        <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
};

function RoleBadge({ role }: { role: string }) {
  const s = ROLE_STYLE[role] ?? ROLE_STYLE.EMPLOYEE;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${s.pill}`}
    >
      {s.icon}
      {role === 'EMPLOYEE' ? 'Technician' : nice(role)}
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
    <div className="mx-auto max-w-7xl space-y-5" aria-label="Loading users">
      <div className="ad-shimmer h-9 w-48 rounded-xl bg-slate-200" />
      <div className="ad-shimmer h-24 rounded-2xl bg-slate-200" />
      <div className="ad-shimmer h-[520px] rounded-2xl bg-slate-200" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminUsersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const url = role
        ? `/admin/manage/users?role=${encodeURIComponent(role)}`
        : '/admin/manage/users';

      const list = await adminFetchList<Row>(url);
      setRows(list);
    } catch (e) {
      setError((e as Error).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.name, r.email, r.mobile]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, query]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of rows) map[r.role] = (map[r.role] ?? 0) + 1;
    return map;
  }, [rows]);

  const technicianCount = counts.EMPLOYEE ?? 0;
  const employerCount = counts.EMPLOYER ?? 0;

  return (
    <AdminShell>
      <style>{STYLES}</style>

      <div className="mx-auto max-w-7xl space-y-5">
        {/* ---------- Header ---------- */}
        <div className="ad-up flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-700 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
              Users
            </h1>
            <p className="mt-1 max-w-2xl text-slate-600">
              Everyone who has registered on Skilho.
            </p>
          </div>
          {!loading && !error && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3.5 py-1.5 font-medium text-slate-600 shadow-sm backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {rows.length.toLocaleString('en-IN')} {rows.length === 1 ? 'user' : 'users'}
              </span>
              <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3.5 py-1.5 font-medium text-slate-600 shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                {technicianCount} technicians
              </span>
              <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3.5 py-1.5 font-medium text-slate-600 shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                {employerCount} employers
              </span>
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
                    placeholder="Search by name, email or mobile"
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
                    htmlFor="role-filter"
                    className="text-xs font-semibold text-slate-500"
                  >
                    Role
                  </label>
                  <select
                    id="role-filter"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">All</option>
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* role legend */}
              {rows.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => setRole('')}
                    className={`ad-pill inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      role === ''
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    All
                  </button>
                  {ROLES.filter((r) => (counts[r.value] ?? 0) > 0).map((r) => {
                    const st = ROLE_STYLE[r.value];
                    const active = role === r.value;
                    return (
                      <button
                        key={r.value}
                        onClick={() => setRole(r.value)}
                        className={`ad-pill inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          active
                            ? `${st.pill} border-transparent shadow-sm`
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        {r.label}
                        <span className="tabular-nums opacity-70">{counts[r.value]}</span>
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
                      <th className="px-5 py-3">Name</th>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Mobile</th>
                      <th className="px-5 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visible.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-16 text-center">
                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                              <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <p className="font-semibold text-slate-900">
                            {query || role ? 'No matching users' : 'No users yet'}
                          </p>
                          <p className="mt-1 text-slate-500">
                            {query || role
                              ? 'Try a different search, role or clear the filters.'
                              : 'Registered users will appear here.'}
                          </p>
                          {(query || role) && (
                            <button
                              onClick={() => {
                                setQuery('');
                                setRole('');
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
                      const st = ROLE_STYLE[r.role] ?? ROLE_STYLE.EMPLOYEE;
                      return (
                        <tr
                          key={r.id}
                          className="ad-up"
                          style={{ animationDelay: `${140 + i * 30}ms` }}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-bold ring-1 ${st.avatar}`}>
                                {initials(r.name)}
                              </span>
                              <span className="font-semibold text-slate-900">{r.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <RoleBadge role={r.role} />
                          </td>
                          <td className="px-5 py-4 text-slate-700">
                            {r.email || <span className="text-slate-400">—</span>}
                          </td>
                          <td className="px-5 py-4 text-slate-700">
                            {r.mobile || <span className="text-slate-400">—</span>}
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
                  {rows.length === 1 ? 'user' : 'users'}
                  {role && (
                    <>
                      {' '}· filtered by{' '}
                      <span className="font-semibold text-slate-700">
                        {role === 'EMPLOYEE' ? 'Technician' : nice(role)}
                      </span>
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