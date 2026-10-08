'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

type Role = 'employee' | 'employer';

type Props = {
  role: Role;
  // Plug in your existing login logic here. Throw an Error to show a message.
  onSubmit?: (data: { identifier: string; password: string; role: Role }) => Promise<void>;
};

const copy = {
  employee: {
    badge: 'Technician sign in',
    title: 'Your next repair job is here.',
    body: 'Build a professional profile, showcase your skills and career journey, and apply to jobs from verified companies.',
  },
  employer: {
    badge: 'Company sign in',
    title: 'Hire verified technicians, faster.',
    body: 'Post repair jobs, review skilled profiles and build your team in one place.',
  },
} as const;

const list: Variants = { show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 16 } },
};
const word: Variants = {
  hidden: { y: '110%' },
  show: { y: 0, transition: { type: 'spring', stiffness: 110, damping: 15 } },
};

export default function AnimatedLoginForm({ role, onSubmit }: Props) {
  const reduce = useReducedMotion();
  const c = copy[role];
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (onSubmit) await onSubmit({ identifier, password, role });
      else console.warn('AnimatedLoginForm: pass an onSubmit prop to handle login.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in. Check your details and try again.');
      setShake((n) => n + 1);
    } finally {
      setLoading(false);
    }
  }

  const input =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15';

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Brand panel */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-teal-950 to-teal-800 text-white px-8 py-10 lg:px-16 lg:py-14 flex flex-col justify-between min-h-[320px]">
        {/* Rotating dials behind the wrench */}
        {!reduce && (
          <div aria-hidden className="pointer-events-none absolute -right-32 -bottom-32 h-[520px] w-[520px]">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-dashed border-teal-300/25"
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-14 rounded-full border-2 border-dashed border-emerald-300/25"
              animate={{ rotate: -360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-28 rounded-full border border-teal-200/20"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        )}

        <motion.div
          className="relative flex items-center gap-3"
          initial={reduce ? false : { opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-lg font-bold">S</span>
          <span className="text-xl font-bold tracking-tight">Skilho</span>
        </motion.div>

        <div className="relative my-12 lg:my-0">
          <motion.div
            className="mb-6 inline-block text-5xl"
            animate={reduce ? undefined : { rotate: [0, -14, 0], y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            🔧
          </motion.div>
          <motion.h1
            className="text-4xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight max-w-xl"
            variants={list}
            initial={reduce ? false : 'hidden'}
            animate="show"
          >
            {c.title.split(' ').map((w, i) => (
              <span key={i} className="inline-block overflow-hidden align-bottom mr-[0.25em]">
                <motion.span className="inline-block" variants={word}>
                  {w}
                </motion.span>
              </span>
            ))}
          </motion.h1>
          <motion.p
            className="mt-6 max-w-md text-lg leading-relaxed text-teal-50/75"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            {c.body}
          </motion.p>
        </div>

        <p className="relative text-sm text-teal-100/50">© 2026 Skilho. All rights reserved.</p>
      </section>

      {/* Form panel */}
      <section className="relative flex items-center justify-center px-6 py-12 overflow-hidden">
        {!reduce && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-emerald-300/40 blur-3xl"
            animate={{ x: [0, -50, 0], y: [0, -40, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <motion.form
          onSubmit={handleSubmit}
          className="relative z-10 w-full max-w-md"
          variants={list}
          initial={reduce ? false : 'hidden'}
          animate="show"
        >
          <motion.span
            variants={item}
            className="inline-block rounded-lg border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800"
          >
            {c.badge}
          </motion.span>

          <motion.h2 variants={item} className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900">
            Welcome back
          </motion.h2>
          <motion.p variants={item} className="mt-2 text-slate-500">
            Sign in to continue to your dashboard.
          </motion.p>

          <motion.div variants={item} className="mt-8">
            <label htmlFor="identifier" className="mb-1.5 block text-sm font-semibold text-slate-800">
              Email or mobile number
            </label>
            <input
              id="identifier"
              className={input}
              placeholder="you@example.com"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </motion.div>

          <motion.div variants={item} className="mt-5">
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-800">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                className={`${input} pr-16`}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-sm font-medium text-teal-700 hover:bg-teal-50"
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="mt-2 text-right">
              <Link href="/forgot-password" className="text-sm font-semibold text-teal-700 hover:underline">
                Forgot password?
              </Link>
            </div>
          </motion.div>

          {error && (
            <motion.p
              key={shake}
              role="alert"
              className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
              initial={{ x: 0 }}
              animate={{ x: [0, -8, 8, -6, 6, 0] }}
              transition={{ duration: 0.4 }}
            >
              {error}
            </motion.p>
          )}

          <motion.button
            variants={item}
            type="submit"
            disabled={loading}
            whileHover={reduce || loading ? undefined : { scale: 1.02 }}
            whileTap={reduce || loading ? undefined : { scale: 0.97 }}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 py-3.5 text-lg font-semibold text-white shadow-lg shadow-teal-700/25 transition-colors hover:bg-teal-800 disabled:opacity-70"
          >
            {loading && (
              <motion.span
                className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
            )}
            {loading ? 'Signing in…' : 'Sign in'}
          </motion.button>

          <motion.p variants={item} className="mt-6 text-center text-slate-500">
            New here?{' '}
            <Link href={`/signup/${role}`} className="font-semibold text-teal-700 hover:underline">
              Create an account
            </Link>
          </motion.p>
          <motion.p variants={item} className="mt-3 text-center">
            <Link href="/" className="text-sm text-slate-400 hover:text-slate-600">
              ← Back to home
            </Link>
          </motion.p>
        </motion.form>
      </section>
    </main>
  );
}