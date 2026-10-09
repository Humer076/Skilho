'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import Icon from '../../components/Icon';
import { CountUp, EASE, GlowCard, rise, stagger } from '../../components/motion';

const API = 'http://localhost:3001';

type SavedJob = {
  id: string;
  title: string;
  city: string;
  state: string;
  status: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryNegotiable: boolean;
  employerProfile: { companyName: string };
};

function salaryText(job: SavedJob) {
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

export default function SavedJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem('skilho_token');
    if (!token) {
      router.replace('/login/employee');
      return;
    }
    try {
      const res = await fetch(`${API}/employee/saved-jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('skilho_token');
        router.replace('/login/employee');
        return;
      }
      if (!res.ok) {
        throw new Error(`Could not load saved jobs (error ${res.status})`);
      }
      setJobs(await res.json());
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

  async function unsave(job: SavedJob) {
    setBusy(true);
    setRemovingId(job.id);
    try {
      await fetch(`${API}/jobs/${job.id}/save`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('skilho_token')}`,
        },
      });
      await load();
    } finally {
      setBusy(false);
      setRemovingId(null);
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
          className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
            <div>
              <Link
                href="/dashboard/employee"
                className="group inline-flex items-center gap-1 text-sm font-medium text-blue-600"
              >
                <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
                Back to dashboard
              </Link>
              <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-slate-900">Saved Jobs</h1>
            </div>
            <motion.span
              className="rounded-full bg-blue-50 px-3.5 py-1.5 text-sm font-semibold text-blue-700"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.4 }}
            >
              <CountUp value={jobs.length} /> saved
            </motion.span>
          </div>
        </motion.header>

        <div className="relative mx-auto max-w-3xl p-6">
          {jobs.length === 0 ? (
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
                <Icon name="bookmark" className="h-8 w-8" />
              </motion.span>
              <p className="mt-5 text-lg font-bold text-slate-900">No saved jobs yet.</p>
              <p className="mt-1 text-slate-500">Save jobs you like and they will show up here.</p>
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
            <motion.ul className="space-y-4" variants={stagger(0.09, 0.1)} initial="hidden" animate="show">
              <AnimatePresence mode="popLayout">
                {jobs.map((job) => {
                  const inactive = job.status !== 'ACTIVE';
                  const removing = removingId === job.id;
                  return (
                    <motion.li
                      key={job.id}
                      layout
                      exit={{ opacity: 0, x: 80, scale: 0.95, transition: { duration: 0.35, ease: EASE } }}
                    >
                      <GlowCard
                        variants={rise}
                        tilt={false}
                        className={`flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-slate-200/70 ${
                          inactive || removing ? 'opacity-70' : ''
                        }`}
                      >
                        <div className="flex min-w-0 items-start gap-4">
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-extrabold text-white shadow-md shadow-blue-500/30"
                            aria-hidden="true"
                          >
                            {job.employerProfile.companyName[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/jobs/${job.id}`}
                              className="text-lg font-semibold text-slate-900 transition-colors hover:text-blue-700"
                            >
                              {job.title}
                            </Link>
                            <p className="text-slate-600">
                              {job.employerProfile.companyName} · {job.city}, {job.state}
                            </p>
                            <p className="mt-1 text-sm text-slate-700">
                              {salaryText(job)}
                              {inactive && <span className="text-red-600"> · No longer active</span>}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          onClick={() => unsave(job)}
                          disabled={busy}
                          className="shrink-0 rounded-lg border border-slate-200 px-3.5 py-1.5 text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.94 }}
                        >
                          {removing ? 'Removing...' : 'Remove'}
                        </motion.button>
                      </GlowCard>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </motion.ul>
          )}
        </div>
      </main>
    </MotionConfig>
  );
}