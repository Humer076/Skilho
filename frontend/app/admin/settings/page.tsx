'use client';

import { useEffect, useState } from 'react';
import AdminShell from '../components/AdminShell';
import { adminFetch } from '../components/adminApi';
import { fmtDate } from '../components/ListPage';

type Me = { email: string | null; mobile: string | null; role: string; createdAt: string };

/* ------------------------------------------------------------------ */
/*  Motion / polish layer (visual only — no logic)                     */
/* ------------------------------------------------------------------ */
const STYLES = `
  @keyframes adUp   { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes adIn   { from { opacity: 0; } to { opacity: 1; } }
  @keyframes adPop  { from { opacity: 0; transform: translateY(14px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes adShimmer { 100% { transform: translateX(100%); } }
  @keyframes adSpin { to { transform: rotate(360deg); } }
  @keyframes adPulseRing { 0% { box-shadow: 0 0 0 0 rgba(99,102,241,.4); } 70% { box-shadow: 0 0 0 10px rgba(99,102,241,0); } 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); } }

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

  .ad-tile { transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease, background-color .2s ease, color .2s ease; }
  .ad-tile:hover { transform: translateY(-1px) scale(1.03); }

  .ad-avatar { animation: adPulseRing 3s ease-out infinite; }

  .ad-field { transition: background-color .2s ease, border-color .2s ease; }
  .ad-field:hover { background-color: #f8fafc; border-color: #e2e8f0; }

  @media (prefers-reduced-motion: reduce) {
    .ad-up, .ad-pop, .ad-in, .ad-shimmer::after, .ad-spin, .ad-avatar { animation: none !important; opacity: 1 !important; }
    .ad-card:hover, .ad-tile:hover { transform: none; }
  }
`;

/* ------------------------------------------------------------------ */
/*  Building blocks                                                    */
/* ------------------------------------------------------------------ */

function Section({
  title, subtitle, icon, children, delay = 0,
}: { title: string; subtitle?: string; icon: React.ReactNode; children: React.ReactNode; delay?: number }) {
  return (
    <section
      className="ad-card ad-up surface overflow-hidden shadow-sm hover:shadow-xl"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-600 ring-1 ring-indigo-100">
          {icon}
        </span>
        <div>
          <h2 className="font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6" aria-label="Loading settings">
      <div className="ad-shimmer h-9 w-48 rounded-xl bg-slate-200" />
      <div className="ad-shimmer h-48 rounded-2xl bg-slate-200" />
      <div className="ad-shimmer h-72 rounded-2xl bg-slate-200" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminSettingsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loadErr, setLoadErr] = useState('');

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminFetch<Me>('/admin/manage/me').then(setMe).catch((e: Error) => setLoadErr(e.message));
  }, []);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setOk('');
    if (next.length < 8) return setErr('New password must be at least 8 characters.');
    if (next !== confirm) return setErr('The new passwords do not match.');

    setBusy(true);
    try {
      await adminFetch('/admin/manage/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      setOk('Password changed. Use the new password next time you sign in.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const initials = (me?.email ?? me?.mobile ?? 'A').trim().charAt(0).toUpperCase();

  return (
    <AdminShell>
      <style>{STYLES}</style>

      <div className="mx-auto max-w-3xl space-y-6">
        {/* ---------- Header ---------- */}
        <div className="ad-up">
          <h1 className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-700 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            Settings
          </h1>
          <p className="mt-1 text-slate-600">Your admin account.</p>
        </div>

        {/* ---------- Account card ---------- */}
        <Section
          title="Account"
          subtitle="Your admin identity and account info"
          delay={60}
          icon={
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        >
          {loadErr && (
            <div role="alert" className="ad-pop flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <span aria-hidden>⚠️</span> {loadErr}
            </div>
          )}

          {!me && !loadErr && (
            <div className="flex items-center gap-4">
              <div className="ad-shimmer h-16 w-16 shrink-0 rounded-2xl bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="ad-shimmer h-4 w-1/3 rounded bg-slate-200" />
                <div className="ad-shimmer h-4 w-1/2 rounded bg-slate-200" />
              </div>
            </div>
          )}

          {me && (
            <div className="space-y-6">
              {/* profile row */}
              <div className="flex items-center gap-4">
                <span className="ad-avatar flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-extrabold text-white shadow-lg ring-4 ring-indigo-100">
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-lg font-extrabold text-slate-900">
                    {me.email || me.mobile || 'Administrator'}
                  </p>
                  <p className="flex items-center gap-1.5 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                    <span className="text-slate-400">·</span>
                    <span>Administrator</span>
                  </p>
                </div>
              </div>

              {/* details grid */}
              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="ad-field rounded-lg border border-slate-200 px-4 py-3">
                  <dt className="text-xs font-medium text-slate-400">Email</dt>
                  <dd className="mt-0.5 break-words text-sm font-semibold text-slate-900">{me.email || '—'}</dd>
                </div>
                <div className="ad-field rounded-lg border border-slate-200 px-4 py-3">
                  <dt className="text-xs font-medium text-slate-400">Mobile</dt>
                  <dd className="mt-0.5 break-words text-sm font-semibold text-slate-900">{me.mobile || '—'}</dd>
                </div>
                <div className="ad-field rounded-lg border border-slate-200 px-4 py-3">
                  <dt className="text-xs font-medium text-slate-400">Role</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-slate-900">Administrator</dd>
                </div>
                <div className="ad-field rounded-lg border border-slate-200 px-4 py-3">
                  <dt className="text-xs font-medium text-slate-400">Account created</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-slate-900">{fmtDate(me.createdAt)}</dd>
                </div>
              </dl>
            </div>
          )}
        </Section>

        {/* ---------- Change password ---------- */}
        <Section
          title="Change password"
          subtitle="Keep your admin account secure"
          delay={120}
          icon={
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        >
          <form onSubmit={changePassword} className="max-w-sm space-y-4">
            <div className="ad-up" style={{ animationDelay: '160ms' }}>
              <label htmlFor="current" className="label-premium">Current password</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <input
                  id="current"
                  type="password"
                  autoComplete="current-password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  required
                  className="input-premium !pl-10"
                  placeholder="Enter current password"
                />
              </div>
            </div>

            <div className="ad-up" style={{ animationDelay: '200ms' }}>
              <label htmlFor="next" className="label-premium">New password</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
                <input
                  id="next"
                  type="password"
                  autoComplete="new-password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  required
                  minLength={8}
                  className="input-premium !pl-10"
                  placeholder="At least 8 characters"
                />
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-slate-400">
                  <path d="M12 16v-4m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                At least 8 characters.
              </p>
            </div>

            <div className="ad-up" style={{ animationDelay: '240ms' }}>
              <label htmlFor="confirm" className="label-premium">Confirm new password</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="input-premium !pl-10"
                  placeholder="Re-enter new password"
                />
              </div>
            </div>

            {err && (
              <div role="alert" className="ad-pop flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                <span aria-hidden>⚠️</span> {err}
              </div>
            )}
            {ok && (
              <div role="status" className="ad-pop flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                <span aria-hidden>✓</span> {ok}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="ad-tile inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 font-semibold text-white shadow-md transition hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
            >
              {busy ? (
                <>
                  <svg className="ad-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                    <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  Please wait...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Change password
                </>
              )}
            </button>
          </form>
        </Section>
      </div>
    </AdminShell>
  );
}