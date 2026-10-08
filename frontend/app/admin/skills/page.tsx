'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminShell from '../components/AdminShell';
import { adminFetch } from '../components/adminApi';
import { adminFetchList } from '../components/listApi';
import { fmtDate } from '../components/ListPage';

type Row = { id: string; name: string; active: boolean; createdAt: string; _count: { employees: number } };

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

/* ------------------------------------------------------------------ */
/*  Building blocks                                                    */
/* ------------------------------------------------------------------ */

function Skeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-5" aria-label="Loading skills">
      <div className="ad-shimmer h-9 w-56 rounded-xl bg-slate-200" />
      <div className="ad-shimmer h-20 rounded-2xl bg-slate-200" />
      <div className="ad-shimmer h-[520px] rounded-2xl bg-slate-200" />
    </div>
  );
}

function AddSkill({ reload, onError }: { reload: () => void; onError: (msg: string) => void }) {
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    onError('');
    setBusy(true);
    try {
      await adminFetch('/admin/manage/skills', { method: 'POST', body: JSON.stringify({ name }) });
      setName('');
      reload();
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const disabled = busy || name.trim().length < 2;

  return (
    <form onSubmit={add} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <label>
            <span className="sr-only">New skill name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New skill, e.g. Micro-soldering"
              className="input-premium !w-72 !pl-10"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={disabled}
          className="ad-tile inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 font-semibold text-white shadow-md transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? (
            <>
              <svg className="ad-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
              Adding...
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Add skill
            </>
          )}
        </button>
      </div>

      {err && (
        <p role="alert" className="ad-pop flex items-start gap-2 text-sm font-medium text-red-700">
          <span aria-hidden>⚠️</span> {err}
        </p>
      )}
    </form>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        active
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
          : 'bg-slate-100 text-slate-600 ring-slate-300'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {active ? 'Active' : 'Hidden'}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminSkillsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  // TEMP DEBUG — remove once skills render correctly
  const [debugRaw, setDebugRaw] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setDebugRaw('');
    try {
      const list = await adminFetchList<Row>('/admin/manage/skills');
      setRows(list);

      // TEMP DEBUG — capture the raw shape if we got nothing back
      if (list.length === 0) {
        const raw = await adminFetch<unknown>('/admin/manage/skills');
        console.log('RAW skills response:', raw);
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

  async function toggle(row: Row) {
    setError('');
    setBusyId(row.id);
    try {
      await adminFetch(`/admin/manage/skills/${row.id}/active`, {
        method: 'POST',
        body: JSON.stringify({ active: !row.active }),
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
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, query]);

  const activeCount = rows.filter((r) => r.active).length;
  const hiddenCount = rows.length - activeCount;

  return (
    <AdminShell>
      <style>{STYLES}</style>

      <div className="mx-auto max-w-7xl space-y-5">
        {/* ---------- Header ---------- */}
        <div className="ad-up flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-700 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
              Skills
            </h1>
            <p className="mt-1 text-slate-600">
              The skills technicians can add to their profile.
            </p>
          </div>
          {!loading && !error && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3.5 py-1.5 font-medium text-slate-600 shadow-sm backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {activeCount} active
              </span>
              <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3.5 py-1.5 font-medium text-slate-600 shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                {hiddenCount} hidden
              </span>
            </div>
          )}
        </div>

        {/* TEMP DEBUG BOX — remove once skills render correctly */}
        {debugRaw && (
          <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-4 text-xs">
            <p className="mb-2 font-bold text-amber-900">
              DEBUG — raw response from /admin/manage/skills:
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
            {/* ---------- Add skill card ---------- */}
            <section
              className="ad-card ad-up surface p-5 shadow-sm"
              style={{ animationDelay: '60ms' }}
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-600 ring-1 ring-indigo-100">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div>
                  <h2 className="font-bold text-slate-900">Add a new skill</h2>
                  <p className="text-xs text-slate-500">Skills appear immediately for technicians to select.</p>
                </div>
              </div>
              <AddSkill reload={load} onError={setError} />
            </section>

            {/* ---------- Table ---------- */}
            <section
              className="ad-up overflow-hidden rounded-xl ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(12,16,19,.04),0_10px_28px_-14px_rgba(15,88,112,.14)] bg-white shadow-sm"
              style={{ animationDelay: '120ms' }}
            >
              {/* Search bar */}
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
                    placeholder="Search skills"
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
                    <>Showing all {rows.length.toLocaleString('en-IN')} skills</>
                  )}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="ad-table w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Skill</th>
                      <th className="px-5 py-3">Technicians</th>
                      <th className="px-5 py-3">Added</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visible.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-16 text-center">
                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                              <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </div>
                          <p className="font-semibold text-slate-900">
                            {query ? 'No matching skills' : 'No skills yet'}
                          </p>
                          <p className="mt-1 text-slate-500">
                            {query
                              ? 'Try a different name or clear your search.'
                              : 'Add the first skill using the form above.'}
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

                    {visible.map((r, i) => (
                      <tr
                        key={r.id}
                        className="ad-up"
                        style={{ animationDelay: `${140 + i * 30}ms` }}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-600 ring-1 ring-indigo-100">
                              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                                <path d="m12 3 2.6 5.5 6 .9-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.4l6-.9L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                              </svg>
                            </span>
                            <span className="font-semibold text-slate-900">{r.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex min-w-[1.75rem] justify-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-700">
                            {r._count?.employees ?? 0}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {fmtDate(r.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge active={r.active} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => toggle(r)}
                            disabled={busyId === r.id}
                            className={`ad-tile inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              r.active
                                ? 'border-slate-300 bg-white text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100'
                            }`}
                          >
                            {busyId === r.id ? (
                              <svg className="ad-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                                <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                              </svg>
                            ) : r.active ? (
                              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                                <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.9 10.9 0 0 1 12 5c7 0 10 7 10 7a17.8 17.8 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3 7 10 7c1.8 0 3.3-.4 4.6-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                              </svg>
                            )}
                            {r.active ? 'Hide' : 'Show'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {visible.length > 0 && (
                <div className="border-t border-slate-200 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
                  Showing <span className="font-semibold text-slate-700">{visible.length}</span> of{' '}
                  <span className="font-semibold text-slate-700">{rows.length}</span> skills
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AdminShell>
  );
}