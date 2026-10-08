'use client';

import { useEffect, useState } from 'react';
import AdminShell from '../components/AdminShell';
import { adminFetch } from '../components/adminApi';
import { nice } from '../components/ListPage';

type Item = { name: string; count: number };
type Report = {
  verificationStatus: Item[];
  applicationStatus: Item[];
  jobStatus: Item[];
  topSkills: Item[];
  signups: Item[];
  verifiedTechnicians: number;
  activeSubscriptions: number;
};

/* ------------------------------------------------------------------ */
/*  Motion / polish layer (visual only — no logic)                     */
/* ------------------------------------------------------------------ */
const STYLES = `
  @keyframes adUp   { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes adIn   { from { opacity: 0; } to { opacity: 1; } }
  @keyframes adPop  { from { opacity: 0; transform: translateY(14px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes adShimmer { 100% { transform: translateX(100%); } }
  @keyframes adGrow { from { width: 0; } }

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

  .ad-tile { transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease, background-color .2s ease, color .2s ease; }
  .ad-tile:hover { transform: translateY(-1px) scale(1.03); }

  .ad-grow { animation: adGrow 1.1s cubic-bezier(.22,.61,.36,1) both; }

  @media (prefers-reduced-motion: reduce) {
    .ad-up, .ad-pop, .ad-in, .ad-shimmer::after, .ad-grow { animation: none !important; opacity: 1 !important; }
    .ad-card:hover, .ad-tile:hover { transform: none; }
  }
`;

/* ------------------------------------------------------------------ */
/*  Building blocks                                                    */
/* ------------------------------------------------------------------ */

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function KpiCard({
  label, value, icon, grad, delay,
}: { label: string; value: number; icon: React.ReactNode; grad: string; delay: number }) {
  const animated = useCountUp(value);
  return (
    <div
      className="ad-card ad-up group relative overflow-hidden rounded-xl ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(12,16,19,.04),0_10px_28px_-14px_rgba(15,88,112,.14)] bg-white p-5 shadow-sm hover:border-slate-300 hover:shadow-xl"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${grad} opacity-[0.10] blur-2xl transition-opacity duration-300 group-hover:opacity-25`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-extrabold leading-none tabular-nums tracking-tight text-slate-900">
            {Math.round(animated).toLocaleString('en-IN')}
          </p>
        </div>
        <span className={`ad-tile flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-white shadow-md`}>
          {icon}
        </span>
      </div>
    </div>
  );
}

function Breakdown({ title, items, pretty = true, delay = 0 }: { title: string; items: Item[]; pretty?: boolean; delay?: number }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  const isEmpty = items.length === 0 || items.every((i) => i.count === 0);

  return (
    <section
      className="ad-card ad-up surface p-5 shadow-sm hover:shadow-xl"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-600 ring-1 ring-indigo-100">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
              <path d="M3 3v18h18M7 14l4-4 4 4 4-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {title}
        </h2>
        {!isEmpty && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-600">
            {items.reduce((sum, i) => sum + i.count, 0).toLocaleString('en-IN')}
          </span>
        )}
      </div>

      {isEmpty ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M3 3v18h18M7 14l4-4 4 4 4-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">No data yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((i, idx) => (
            <li key={i.name} className="text-sm">
              <div className="mb-1 flex justify-between gap-3">
                <span className="truncate text-slate-600" title={pretty ? nice(i.name) : i.name}>
                  {pretty ? nice(i.name) : i.name}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                  {i.count.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="ad-grow h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                  style={{ width: `${(i.count / max) * 100}%`, animationDelay: `${delay + 120 + idx * 60}ms` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-5" aria-label="Loading reports">
      <div className="ad-shimmer h-9 w-56 rounded-xl bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="ad-shimmer h-32 rounded-2xl bg-slate-200" />
        <div className="ad-shimmer h-32 rounded-2xl bg-slate-200" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="ad-shimmer h-64 rounded-2xl bg-slate-200" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminReportsPage() {
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminFetch<Report>('/admin/manage/reports').then(setData).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <AdminShell>
      <style>{STYLES}</style>

      <div className="mx-auto max-w-7xl space-y-5">
        {/* ---------- Header ---------- */}
        <div className="ad-up">
          <h1 className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-700 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            Reports
          </h1>
          <p className="mt-1 text-slate-600">A summary of activity across Skilho.</p>
        </div>

        {error && (
          <div role="alert" className="ad-pop flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
            <span aria-hidden>⚠️</span> {error}
          </div>
        )}

        {!data && !error && <Skeleton />}

        {data && (
          <>
            {/* ---------- KPI cards ---------- */}
            <div className="grid gap-4 sm:grid-cols-2">
              <KpiCard
                label="Verified technicians"
                value={data.verifiedTechnicians}
                delay={60}
                grad="from-emerald-500 to-teal-600"
                icon={
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                    <path d="m9 12 2 2 4-4M12 3 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
              />
              <KpiCard
                label="Active employer subscriptions"
                value={data.activeSubscriptions}
                delay={120}
                grad="from-indigo-500 to-violet-600"
                icon={
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                    <path d="M3 10h18M7 15h.01M11 15h2M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
              />
            </div>

            {/* ---------- Breakdowns ---------- */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Breakdown title="New sign-ups by month" items={data.signups} pretty={false} delay={180} />
              <Breakdown title="Company verification status" items={data.verificationStatus} delay={240} />
              <Breakdown title="Jobs by status" items={data.jobStatus} delay={300} />
              <Breakdown title="Applications by status" items={data.applicationStatus} delay={360} />
              <Breakdown title="Most common technician skills" items={data.topSkills} pretty={false} delay={420} />
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}