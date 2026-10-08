'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import Icon from '../../components/Icon';
import { CountUp, EASE, GlowCard, rise, stagger } from '../../components/motion';

const API = 'http://localhost:3000';

type App = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    city: string;
    state: string;
    status: string;
    employerProfile: { companyName: string };
  };
};

const STATUS_CLASS: Record<string, string> = {
  APPLIED: 'bg-gray-100 text-gray-700',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800',
  SHORTLISTED: 'bg-purple-100 text-purple-800',
  INTERVIEW_SCHEDULED: 'bg-amber-100 text-amber-800',
  SELECTED: 'bg-green-100 text-green-800',
  HIRED: 'bg-green-200 text-green-900',
  REJECTED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-gray-200 text-gray-600',
};

const FINAL = ['HIRED', 'REJECTED', 'WITHDRAWN'];

// Happy-path stages, used for the progress tracker on each card
const STAGES = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'HIRED'];

function label(status: string) {
  return status.replace(/_/g, ' ');
}

function Notice({ text, kind }: { text: string; kind: 'ok' | 'err' }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.p
          key={text}
          role={kind === 'err' ? 'alert' : 'status'}
          className={`mb-4 rounded-lg px-4 py-2.5 text-sm ${
            kind === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0, x: kind === 'err' ? [0, -8, 8, -6, 6, 0] : 0 }}
          exit={{ opacity: 0 }}
        >
          {text}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function Tracker({ status }: { status: string }) {
  const idx = STAGES.indexOf(status);
  if (idx === -1) return null; // rejected / withdrawn: no progress bar
  return (
      <div className="mt-3" title={`Stage ${idx + 1} of ${STAGES.length}: ${label(status)}`}>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
          initial={{ width: 0 }}
          animate={{ width: `${((idx + 1) / STAGES.length) * 100}%` }}
          transition={{ duration: 1, ease: EASE, delay: 0.5 }}
        />
      </div>
      <div className="mt-1.5 flex justify-between">
        {STAGES.map((s, i) => (
          <motion.span
            key={s}
            className={`h-1.5 w-1.5 rounded-full ${i <= idx ? 'bg-blue-500' : 'bg-slate-200'}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.5 + i * 0.08 }}
          />
        ))}
      </div>
    </div>
  );
}

export default function MyApplicationsPage() {
  const router = useRouter();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const token = localStorage.getItem('skilho_token');
    if (!token) {
      router.replace('/login/employee');
      return;
    }
    try {
      const res = await fetch(`${API}/employee/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('skilho_token');
        router.replace('/login/employee');
        return;
      }
      if (!res.ok) {
        throw new Error(`Could not load applications (error ${res.status})`);
      }
      setApps(await res.json());
      setLoadError('');
    } catch (err) {
      setLoadError(
        err instanceof TypeError
          ? 'Cannot reach the backend. Is it running on port 3000?'
          : err instanceof Error
            ? err.message
            : 'Something went wrong',
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function withdraw(app: App) {
    if (!window.confirm(`Withdraw your application for "${app.job.title}"?`)) return;
    setError('');
    setMessage('');
    setBusy(true);
    setWithdrawingId(app.id);
    try {
      const res = await fetch(
        `${API}/employee/applications/${app.id}/withdraw`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('skilho_token')}`,
          },
        },
      );
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;
        throw new Error(msg || 'Could not withdraw');
      }
      setMessage('Application withdrawn.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not withdraw');
    } finally {
      setBusy(false);
      setWithdrawingId(null);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <motion.div className="flex items-center gap-2 text-slate-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
          Loading...
        </motion.div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <motion.div
          className="max-w-md rounded-xl bg-white p-6 text-center shadow"
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
        >
          <p className="text-red-600">{loadError}</p>
        </motion.div>
      </main>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative min-h-screen overflow-x-clip bg-slate-50">
        {/* Soft drifting glows */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-0 h-[28rem] w-[28rem] rounded-full bg-blue-400/25 blur-3xl"
          animate={{ x: [0, -80, 0], y: [0, 60, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-1/3 -left-24 h-96 w-96 rounded-full bg-violet-400/15 blur-3xl"
          animate={{ x: [0, 70, 0], y: [0, -60, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Sticky header */}
        <motion.header
          className="relative border-b border-slate-200 bg-white/80 backdrop-blur-md"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6 sm:py-2.5">
            <div>
              <h1 className="text-[20px] font-bold leading-tight tracking-[-0.035em] text-slate-900 sm:text-[22px]">My Applications</h1>
            </div>
            <motion.span
              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.4 }}
            >
              <CountUp value={apps.length} /> total
            </motion.span>
          </div>
        </motion.header>

        <div className="relative mx-auto box-border w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
          <Notice text={error} kind="err" />
          <Notice text={message} kind="ok" />

          {apps.length === 0 ? (
            <motion.div
              className="rounded-xl ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(12,16,19,.04),0_10px_28px_-14px_rgba(15,88,112,.14)] bg-white p-12 text-center shadow-sm"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <motion.span
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"
                animate={{ y: [0, -8, 0], rotate: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Icon name="clipboard" className="h-8 w-8" />
              </motion.span>
              <p className="mt-5 text-lg font-bold text-slate-900">You haven&apos;t applied to any jobs yet.</p>
              <p className="mt-1 text-slate-500">Apply to a job and you can track it here.</p>
              <motion.div className="mt-6 inline-block" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                <Link
                  href="/jobs"
                  className="inline-block rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700"
                >
                  Browse jobs →
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <motion.ul className="mx-auto m-0 w-full max-w-[840px] list-none space-y-2 p-0" variants={stagger(0.09, 0.1)} initial="hidden" animate="show">
              {apps.map((app) => (
                <li key={app.id}>
                  <GlowCard
                    variants={rise}
                    tilt={false}
                    className="box-border h-auto min-h-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow duration-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-extrabold text-white shadow-sm sm:h-10 sm:w-10"
                          aria-hidden="true"
                        >
                          {app.job.employerProfile.companyName[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/jobs/${app.job.id}`}
                            className="block truncate text-base font-semibold leading-6 text-slate-900 transition-colors hover:text-blue-700 sm:text-lg"
                          >
                            {app.job.title}
                          </Link>
                          <p className="mt-0.5 truncate text-sm text-slate-600 sm:text-base">
                            {app.job.employerProfile.companyName} · {app.job.city}, {app.job.state}
                          </p>
                        </div>
                      </div>
                      <motion.span
                        key={app.status}
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          STATUS_CLASS[app.status] ?? 'bg-gray-100 text-gray-700'
                        }`}
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.3 }}
                      >
                        {label(app.status)}
                      </motion.span>
                    </div>

                    <Tracker status={app.status} />

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <p className="m-0 min-w-0 text-xs leading-5 text-slate-400">
                      Applied {new Date(app.createdAt).toLocaleDateString()} · Last updated{' '}
                      {new Date(app.updatedAt).toLocaleDateString()}
                    </p>

                    <AnimatePresence>
                      {!FINAL.includes(app.status) && (
                        <motion.button
                          onClick={() => withdraw(app)}
                          disabled={busy}
                          className="inline-flex h-8 shrink-0 items-center rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
                          exit={{ opacity: 0, scale: 0.9 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.94 }}
                        >
                          {withdrawingId === app.id ? 'Withdrawing...' : 'Withdraw'}
                        </motion.button>
                      )}
                    </AnimatePresence>
                    </div>
                  </GlowCard>
                </li>
              ))}
            </motion.ul>
          )}
        </div>
      </main>
    </MotionConfig>
  );
}
