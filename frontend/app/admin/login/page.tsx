'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const TOKEN_KEY = 'skilho_admin_token';
const ACCESS_KEY = 'skilho_admin_access';

/* ------------------------------------------------------------------ */
/*  Motion / polish layer (visual only — no logic)                     */
/* ------------------------------------------------------------------ */
const STYLES = `
  @keyframes adUp   { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes adIn   { from { opacity: 0; } to { opacity: 1; } }
  @keyframes adPop  { from { opacity: 0; transform: translateY(14px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes adFloat { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px,-30px) scale(1.08); } }
  @keyframes adFloatSlow { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-30px,20px) scale(1.12); } }
  @keyframes adShimmer { 100% { transform: translateX(100%); } }
  @keyframes adSpin { to { transform: rotate(360deg); } }
  @keyframes adGrid { from { background-position: 0 0; } to { background-position: 48px 48px; } }

  .ad-up   { animation: adUp .6s cubic-bezier(.22,.61,.36,1) both; }
  .ad-pop  { animation: adPop .45s cubic-bezier(.22,.61,.36,1) both; }
  .ad-in   { animation: adIn .8s ease both; }
  .ad-spin { animation: adSpin .8s linear infinite; }

  .ad-orb-1 { animation: adFloat 9s ease-in-out infinite; }
  .ad-orb-2 { animation: adFloatSlow 11s ease-in-out infinite; }

  .ad-tile { transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease, background-color .2s ease, color .2s ease; }
  .ad-tile:hover { transform: translateY(-1px) scale(1.02); }

  .ad-logo { transition: transform .4s cubic-bezier(.22,.61,.36,1), box-shadow .4s ease; }
  .ad-logo:hover { transform: rotate(-6deg) scale(1.08); }

  .ad-input-wrap:focus-within .ad-input-glow { opacity: 1; }
  .ad-input-glow { transition: opacity .3s ease; opacity: 0; }

  .ad-grid-bg {
    background-image:
      linear-gradient(to right, rgba(148,163,184,.12) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(148,163,184,.12) 1px, transparent 1px);
    background-size: 48px 48px;
    animation: adGrid 4s linear infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .ad-up, .ad-pop, .ad-in, .ad-orb-1, .ad-orb-2, .ad-spin, .ad-grid-bg { animation: none !important; opacity: 1 !important; }
    .ad-tile:hover, .ad-logo:hover { transform: none; }
  }
`;

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;
        throw new Error(msg || 'Login failed');
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(ACCESS_KEY, data.user?.adminAccess || 'SUPER_ADMIN');
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login grid min-h-screen bg-white lg:grid-cols-2">
      <style>{STYLES}</style>

      {/* ---------- Brand panel ---------- */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* animated background grid */}
        <div className="ad-grid-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden />

        {/* floating gradient orbs */}
        <div className="ad-orb-1 pointer-events-none absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" aria-hidden />
        <div className="ad-orb-2 pointer-events-none absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute right-1/3 top-0 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl" aria-hidden />

        {/* top logo */}
        <div className="ad-up relative z-10 flex items-center gap-3">
          <div className="leading-tight">
            <p className="text-xl font-extrabold tracking-tight">Skilho</p>
            <p className="text-xs text-slate-400">Hire Skilled Technicians</p>
          </div>
        </div>

        {/* middle copy */}
        <div className="relative z-10">
          <h1 className="ad-up max-w-md text-4xl font-extrabold leading-tight tracking-tight" style={{ animationDelay: '100ms' }}>
            Manage users, companies and jobs in{' '}
            <span className="bg-gradient-to-r from-indigo-300 via-sky-300 to-violet-300 bg-clip-text text-transparent">
              one place.
            </span>
          </h1>
          <p className="ad-up mt-4 max-w-md leading-relaxed text-slate-300" style={{ animationDelay: '180ms' }}>
            Review company verifications, monitor applications and keep the platform safe for technicians and employers.
          </p>

          {/* feature chips */}
          <div className="ad-up mt-8 flex flex-wrap gap-2.5" style={{ animationDelay: '260ms' }}>
            {[
              { icon: '🛡️', label: 'Secure access' },
              { icon: '⚡', label: 'Real-time insights' },
              { icon: '✅', label: 'Verified employers' },
            ].map((chip) => (
              <span
                key={chip.label}
                className="ad-tile inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm font-medium text-slate-200 backdrop-blur"
              >
                <span aria-hidden>{chip.icon}</span>
                {chip.label}
              </span>
            ))}
          </div>
        </div>

        {/* bottom footer */}
        <p className="ad-up relative z-10 text-sm text-slate-500" style={{ animationDelay: '320ms' }}>
          © 2026 Skilho
        </p>
      </section>

      {/* ---------- Form panel ---------- */}
      <section className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 sm:p-12 lg:bg-white">
        {/* subtle decorative blobs for mobile / small screens */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-indigo-100/60 blur-3xl lg:hidden" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-violet-100/60 blur-3xl lg:hidden" aria-hidden />

        <div className="relative w-full max-w-sm">
          {/* mobile logo */}
          <div className="ad-up mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="text-lg font-extrabold text-slate-900">Skilho Admin</span>
          </div>

          <div className="ad-up" style={{ animationDelay: '80ms' }}>
            <h2 className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-700 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
              Admin sign in
            </h2>
            <p className="mt-1 mb-8 flex items-center gap-2 text-slate-600">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Authorized staff only.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="ad-pop space-y-5"
            style={{ animationDelay: '160ms' }}
          >
            {/* identifier */}
            <div className="ad-up" style={{ animationDelay: '200ms' }}>
              <label htmlFor="identifier" className="label-premium">Admin email</label>
              <div className="ad-input-wrap relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path d="M4 4h16v16H4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="m4 6 8 7 8-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="admin@skilho.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="input-premium !pl-10"
                />
              </div>
            </div>

            {/* password */}
            <div className="ad-up" style={{ animationDelay: '260ms' }}>
              <label htmlFor="password" className="label-premium">Password</label>
              <div className="ad-input-wrap relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-premium !pl-10 !pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 px-4 text-sm font-semibold text-brand-700 transition hover:text-brand-800"
                  aria-pressed={showPassword}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="ad-pop flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm"
              >
                <span aria-hidden>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="ad-tile group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 font-semibold text-white shadow-md transition hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="ad-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                    <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  Please wait...
                </>
              ) : (
                <>
                  Sign in
                  <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>→</span>
                </>
              )}
            </button>
          </form>

          <p className="ad-up mt-6 flex items-start gap-2 text-xs leading-relaxed text-slate-500" style={{ animationDelay: '340ms' }}>
            <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400">
              <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Access is logged. If you are not an authorized Skilho administrator, please leave this page.
          </p>
        </div>
      </section>
    </main>
  );
}
