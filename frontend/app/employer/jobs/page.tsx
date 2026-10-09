'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, MotionConfig, type Variants } from 'framer-motion';
import {
  EXPERIENCE_OPTIONS,
  JOINING_OPTIONS,
  WORK_TYPE_OPTIONS,
  labelOf,
} from '../../lib/jobOptions';

const API = 'http://localhost:3001';

type Job = {
  id: string;
  title: string;
  category: string;
  vacancies: number;
  experience: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryNegotiable: boolean;
  city: string;
  state: string;
  workType: string;
  joiningPreference: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
};

function salaryText(job: Job) {
  const fmt = (n: number) => n.toLocaleString('en-IN');
  let text = 'Salary not specified';
  if (job.salaryMin != null && job.salaryMax != null) {
    text = `Rs. ${fmt(job.salaryMin)} - ${fmt(job.salaryMax)} / month`;
  } else if (job.salaryMin != null) {
    text = `From Rs. ${fmt(job.salaryMin)} / month`;
  } else if (job.salaryMax != null) {
    text = `Up to Rs. ${fmt(job.salaryMax)} / month`;
  }
  return job.salaryNegotiable ? `${text} (negotiable)` : text;
}

function statusClass(status: string) {
  if (status === 'ACTIVE')
    return 'bg-gradient-to-r from-emerald-100 to-green-100 text-green-800 border border-emerald-200';
  if (status === 'CLOSED')
    return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200';
  return 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border border-slate-200';
}

/* ---------- motion helpers ---------- */

const EASE = [0.22, 1, 0.36, 1] as const;

const stagger = (gap = 0.07, delay = 0.05): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const cardIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

/* ---------- animated background ---------- */

const BG_CSS = `
  @keyframes skilhoDrift1 {
    0%   { transform: translate3d(-8%, -6%, 0) scale(1); }
    50%  { transform: translate3d(10%, 8%, 0) scale(1.15); }
    100% { transform: translate3d(-8%, -6%, 0) scale(1); }
  }
  @keyframes skilhoDrift2 {
    0%   { transform: translate3d(6%, 10%, 0) scale(1.05); }
    50%  { transform: translate3d(-10%, -8%, 0) scale(1.2); }
    100% { transform: translate3d(6%, 10%, 0) scale(1.05); }
  }
  @keyframes skilhoDrift3 {
    0%   { transform: translate3d(0, 0, 0) scale(1); }
    33%  { transform: translate3d(-12%, 6%, 0) scale(1.1); }
    66%  { transform: translate3d(8%, -10%, 0) scale(0.95); }
    100% { transform: translate3d(0, 0, 0) scale(1); }
  }
  @keyframes skilhoGridShift {
    0%   { background-position: 0 0, 0 0; }
    100% { background-position: 60px 60px, 60px 60px; }
  }
  @keyframes skilhoShimmer {
    0%   { background-position: -600px 0; }
    100% { background-position: 600px 0; }
  }
  .skilho-bg-orb-1 { animation: skilhoDrift1 26s ease-in-out infinite; }
  .skilho-bg-orb-2 { animation: skilhoDrift2 32s ease-in-out infinite; }
  .skilho-bg-orb-3 { animation: skilhoDrift3 38s ease-in-out infinite; }
  .skilho-bg-grid {
    background-image:
      linear-gradient(to right, rgba(15, 23, 42, 0.045) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(15, 23, 42, 0.045) 1px, transparent 1px);
    background-size: 60px 60px, 60px 60px;
    animation: skilhoGridShift 24s linear infinite;
    -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, black 40%, transparent 100%);
            mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, black 40%, transparent 100%);
  }
  .skilho-shimmer {
    background: linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%);
    background-size: 1200px 100%;
    animation: skilhoShimmer 1.4s linear infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .skilho-bg-orb-1,
    .skilho-bg-orb-2,
    .skilho-bg-orb-3,
    .skilho-bg-grid,
    .skilho-shimmer {
      animation: none !important;
    }
  }
`;

function AnimatedBackground() {
  return (
    <>
      <style>{BG_CSS}</style>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-slate-50"
      >
        <div className="skilho-bg-orb-1 absolute -top-40 -left-32 h-[42rem] w-[42rem] rounded-full bg-blue-300/35 blur-[120px]" />
        <div className="skilho-bg-orb-2 absolute -top-20 right-[-12rem] h-[38rem] w-[38rem] rounded-full bg-violet-300/30 blur-[120px]" />
        <div className="skilho-bg-orb-3 absolute bottom-[-16rem] left-1/3 h-[36rem] w-[36rem] rounded-full bg-cyan-200/35 blur-[120px]" />
        <div className="skilho-bg-grid absolute inset-0" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/70 to-transparent" />
      </div>
    </>
  );
}

/* ---------- loading skeleton ---------- */

function LoadingState() {
  return (
    <main className="min-h-screen p-6 relative">
      <AnimatedBackground />
      <div className="max-w-4xl mx-auto relative z-10 space-y-5">
        <div className="skilho-shimmer h-4 w-40 rounded-full" />
        <div className="skilho-shimmer h-8 w-1/3 rounded-full" />
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-xl shadow-lg shadow-slate-200/50 p-6 space-y-4 mt-4">
          <div className="skilho-shimmer h-5 w-1/2 rounded-full" />
          <div className="skilho-shimmer h-3 w-2/3 rounded-full" />
          <div className="skilho-shimmer h-3 w-3/4 rounded-full" />
          <div className="flex gap-2 pt-2">
            <div className="skilho-shimmer h-8 w-20 rounded-lg" />
            <div className="skilho-shimmer h-8 w-28 rounded-lg" />
            <div className="skilho-shimmer h-8 w-20 rounded-lg" />
          </div>
        </div>
        <div
          className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-xl shadow-lg shadow-slate-200/50 p-6 space-y-4"
          style={{ animationDelay: '140ms' }}
        >
          <div className="skilho-shimmer h-5 w-1/2 rounded-full" />
          <div className="skilho-shimmer h-3 w-2/3 rounded-full" />
          <div className="skilho-shimmer h-3 w-3/4 rounded-full" />
          <div className="flex gap-2 pt-2">
            <div className="skilho-shimmer h-8 w-20 rounded-lg" />
            <div className="skilho-shimmer h-8 w-28 rounded-lg" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function MyJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companyStatus, setCompanyStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const token = () => localStorage.getItem('skilho_token') ?? '';

  const goToLogin = useCallback(() => {
    localStorage.removeItem('skilho_token');
    router.replace('/login/employer');
  }, [router]);

  const load = useCallback(async () => {
    const t = localStorage.getItem('skilho_token');
    if (!t) {
      goToLogin();
      return;
    }

    setLoadError('');
    try {
      const headers = { Authorization: `Bearer ${t}` };
      const [jobsRes, verRes] = await Promise.all([
        fetch(`${API}/employer/jobs`, { headers }),
        fetch(`${API}/employer/verification`, { headers }),
      ]);

      const denied = [jobsRes.status, verRes.status].some(
        (s) => s === 401 || s === 403,
      );
      if (denied) {
        goToLogin();
        return;
      }

      if (!jobsRes.ok) {
        throw new Error(
          `Could not load jobs (error ${jobsRes.status}). Check the red text in the backend window.`,
        );
      }
      if (!verRes.ok) {
        throw new Error(
          `Could not load company status (error ${verRes.status}). Check the backend window.`,
        );
      }

      setJobs(await jobsRes.json());
      setCompanyStatus((await verRes.json()).status);
    } catch (err) {
      if (err instanceof TypeError) {
        setLoadError(
          'Cannot reach the backend. Is it running on port 3000?',
        );
      } else {
        setLoadError(
          err instanceof Error ? err.message : 'Something went wrong',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [goToLogin]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(job: Job, status: 'ACTIVE' | 'CLOSED') {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const res = await fetch(`${API}/employer/jobs/${job.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;
        throw new Error(msg || 'Action failed');
      }
      setMessage(status === 'ACTIVE' ? 'Job is now live.' : 'Job closed.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  async function removeJob(job: Job) {
    if (!window.confirm(`Delete draft "${job.title}"?`)) return;
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const res = await fetch(`${API}/employer/jobs/${job.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not delete');
      setMessage('Draft deleted.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (loadError) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 relative">
        <AnimatedBackground />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="max-w-md bg-white/85 backdrop-blur-xl border border-white/60 rounded-xl shadow-lg shadow-slate-200/50 p-6 text-center relative z-10"
        >
          <p className="text-red-600 mb-4">{loadError}</p>
          <button
            onClick={() => {
              setLoading(true);
              load();
            }}
            className="bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg px-5 py-2 font-semibold shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 transition-shadow"
          >
            Try again
          </button>
          <p className="mt-4">
            <Link href="/dashboard/employer" className="text-blue-600 text-sm">
              ← Back to dashboard
            </Link>
          </p>
        </motion.div>
      </main>
    );
  }

  const approved = companyStatus === 'APPROVED';

  return (
    <MotionConfig reducedMotion="user">
      <AnimatedBackground />

      <main className="relative min-h-screen p-4 sm:p-5">
        <motion.div
          className="relative z-10 mx-auto max-w-3xl"
          variants={stagger(0.07, 0.05)}
          initial="hidden"
          animate="show"
        >
          {/* Header */}
          <motion.div variants={rise}>
            <Link
              href="/dashboard/employer"
              className="inline-block text-xs font-medium text-blue-600 transition-transform duration-200 hover:-translate-x-0.5"
            >
              ← Back to dashboard
            </Link>

            <div className="mt-1.5 mb-4 flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                My{' '}
                <span className="bg-gradient-to-r from-blue-700 to-violet-600 bg-clip-text text-transparent">
                  Jobs
                </span>
              </h1>
              {approved && (
                <motion.div
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                >
                  <Link
                    href="/employer/jobs/new"
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-600 to-violet-600 shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 transition-shadow"
                  >
                    <span className="text-lg leading-none">+</span> Post a job
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Verification warning */}
          {!approved && (
            <motion.div
              variants={rise}
              className="relative mb-4 overflow-hidden rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-sm shadow-amber-900/5"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-200/40 blur-3xl"
              />
              <div className="relative z-10 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-100 text-base text-amber-700">
                  ⚠
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-amber-800">
                    Company verification
                  </p>
                  <p className="mt-0.5 text-base font-bold tracking-tight text-amber-950">
                    {companyStatus.replace(/_/g, ' ')}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    You can create and publish jobs only while your company is
                    approved.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Messages */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="rounded-xl bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 text-sm px-4 py-3 mb-4"
            >
              {error}
            </motion.p>
          )}
          {message && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="rounded-xl bg-green-50/90 backdrop-blur-sm border border-green-200 text-green-700 text-sm px-4 py-3 mb-4"
            >
              {message}
            </motion.p>
          )}

          {/* Job list */}
          {jobs.length === 0 ? (
            <motion.div
              variants={rise}
              className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm"
            >
              You have not created any jobs yet.
            </motion.div>
          ) : (
            <motion.ul
              className="space-y-4"
              variants={stagger(0.06, 0.1)}
              initial="hidden"
              animate="show"
            >
              {jobs.map((job) => (
                <motion.li
                  key={job.id}
                  variants={cardIn}
                  whileHover={{ y: -3 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                  className="group relative overflow-hidden rounded-xl bg-white/85 backdrop-blur-xl border border-white/60 shadow-md shadow-slate-200/50 p-6 transition-shadow duration-300 hover:shadow-xl hover:shadow-blue-200/40"
                >
                  {/* Top accent */}
                  <span
                    aria-hidden
                    className={`absolute inset-x-0 top-0 h-0.5 ${
                      job.status === 'ACTIVE'
                        ? 'bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-400'
                        : job.status === 'CLOSED'
                          ? 'bg-gradient-to-r from-red-400 via-rose-500 to-red-400'
                          : 'bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200'
                    }`}
                  />

                  {/* Hover sheen */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-blue-50/60 via-transparent to-violet-50/60"
                  />

                  <div className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
                          {job.title}
                        </h2>
                        <p className="text-slate-500 text-sm mt-0.5">
                          {job.category} · {job.city}, {job.state} ·{' '}
                          {labelOf(WORK_TYPE_OPTIONS, job.workType)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold shrink-0 ${statusClass(
                          job.status,
                        )}`}
                      >
                        {job.status}
                      </span>
                    </div>

                    <p className="text-slate-700 text-sm mt-3">
                      {salaryText(job)} · Experience:{' '}
                      {labelOf(EXPERIENCE_OPTIONS, job.experience)} · Joining:{' '}
                      {labelOf(JOINING_OPTIONS, job.joiningPreference)} · Vacancies:{' '}
                      {job.vacancies}
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      {job.publishedAt
                        ? `Posted ${new Date(job.publishedAt).toLocaleDateString()}`
                        : `Created ${new Date(job.createdAt).toLocaleDateString()}`}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <Link
                        href={`/employer/jobs/${job.id}`}
                        className="border border-slate-300 bg-white/70 rounded-lg px-3 py-1.5 text-slate-700 text-sm hover:bg-white hover:border-slate-400 transition-colors"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/employer/jobs/${job.id}/applications`}
                        className="border border-slate-300 bg-white/70 rounded-lg px-3 py-1.5 text-slate-700 text-sm hover:bg-white hover:border-slate-400 transition-colors"
                      >
                        Applications
                      </Link>
                      {job.status !== 'ACTIVE' && (
                        <motion.button
                          disabled={busy || !approved}
                          onClick={() => changeStatus(job, 'ACTIVE')}
                          whileHover={busy || !approved ? undefined : { y: -1 }}
                          whileTap={busy || !approved ? undefined : { scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm rounded-lg px-3 py-1.5 font-medium shadow-sm shadow-emerald-500/25 hover:shadow-md hover:shadow-emerald-500/35 disabled:opacity-40 transition-shadow"
                        >
                          {busy && (
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          )}
                          {job.status === 'CLOSED' ? 'Reopen' : 'Publish'}
                        </motion.button>
                      )}
                      {job.status === 'ACTIVE' && (
                        <motion.button
                          disabled={busy}
                          onClick={() => changeStatus(job, 'CLOSED')}
                          whileHover={busy ? undefined : { y: -1 }}
                          whileTap={busy ? undefined : { scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                          className="bg-slate-800 text-white text-sm rounded-lg px-3 py-1.5 font-medium hover:bg-slate-700 disabled:opacity-40 transition-colors"
                        >
                          Close
                        </motion.button>
                      )}
                      {job.status === 'DRAFT' && (
                        <button
                          disabled={busy}
                          onClick={() => removeJob(job)}
                          className="border border-red-300 bg-white/70 rounded-lg px-3 py-1.5 text-red-600 text-sm hover:bg-red-50 disabled:opacity-40 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </motion.div>
      </main>
    </MotionConfig>
  );
}
