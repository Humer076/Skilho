'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Reveal from '../../components/Reveal';
import {
  EXPERIENCE_OPTIONS,
  JOINING_OPTIONS,
  WORK_TYPE_OPTIONS,
  labelOf,
} from '../../lib/jobOptions';
import { postedText, salaryText } from '../../lib/jobFormat';

const API = 'http://localhost:3000';

type JobDetail = {
  id: string;
  title: string;
  description: string;
  category: string;
  vacancies: number;
  specializations: string[];
  experience: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryNegotiable: boolean;
  city: string;
  state: string;
  workType: string;
  joiningPreference: string;
  workingHours: string | null;
  weeklyHolidays: string | null;
  accommodationProvided: boolean;
  foodProvided: boolean;
  travelAllowance: boolean;
  overtimeAvailable: boolean;
  requiredCertificates: string | null;
  interviewProcess: string | null;
  publishedAt: string | null;
  createdAt: string;
  company: {
    name: string;
    city: string | null;
    state: string | null;
    description: string | null;
    technicianCount: number | null;
    verified: boolean;
  };
};

/* shared style strings */
const CARD =
  'rounded-3xl border border-white bg-white p-6 shadow-[0_20px_60px_-28px_rgba(109,40,217,0.3)] md:p-8';
const H2 = 'text-xl font-bold tracking-tight text-slate-950';
const BTN_PRIMARY =
  'btn-shine inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-7 py-3 font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-700 active:scale-[0.98] disabled:cursor-default disabled:bg-emerald-600 disabled:shadow-emerald-600/25';
const BTN_OUTLINE =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-800 transition hover:border-violet-300 hover:bg-violet-50 active:scale-[0.98]';

const RISING_BOLTS = [
  { left: '6%', d: '14s', delay: '0s', size: 'h-6 w-6' },
  { left: '28%', d: '18s', delay: '4s', size: 'h-8 w-8' },
  { left: '52%', d: '13s', delay: '8s', size: 'h-5 w-5' },
  { left: '74%', d: '17s', delay: '2s', size: 'h-7 w-7' },
  { left: '93%', d: '15s', delay: '6s', size: 'h-6 w-6' },
];

/* ---------- icons ---------- */
function Svg({ children, className = 'h-5 w-5' }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
const BoltIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
  </Svg>
);
const Check = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12l5 5 9-10" />
  </svg>
);
const PinIcon = () => (
  <Svg className="h-4 w-4">
    <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </Svg>
);
const ClockIcon = () => (
  <Svg className="h-4 w-4">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);
const ShieldIcon = () => (
  <Svg className="h-6 w-6">
    <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z" />
    <path d="M9 12l2 2 4-4" />
  </Svg>
);
const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    className="h-5 w-5"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />
  </svg>
);
const ShareIcon = () => (
  <Svg>
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <circle cx="18" cy="18" r="2.5" />
    <path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6" />
  </Svg>
);

/* ---------- shared pieces ---------- */
function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-1.5" aria-label="Skilho home">
          <BoltIcon className="h-7 w-7 fill-violet-600 text-violet-600" />
          <span className="text-[1.7rem] font-extrabold tracking-tight text-slate-900">Skilho</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 text-base font-medium md:flex">
          <Link href="/" className="transition hover:text-violet-600">
            Home
          </Link>
          <Link href="/jobs" className="text-violet-600">
            Find jobs
          </Link>
          <Link href="/register/employer" className="transition hover:text-violet-600">
            Post a job
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login/employee"
            className="hidden rounded-lg border border-slate-200 bg-white px-5 py-2.5 font-medium text-slate-900 transition hover:border-violet-300 hover:bg-violet-50 sm:inline-flex"
          >
            Technician login
          </Link>
          <Link
            href="/login/employer"
            className="btn-shine inline-flex items-center rounded-lg bg-violet-600 px-5 py-2.5 font-semibold text-white transition hover:bg-violet-700"
          >
            Employer login
          </Link>
        </div>
      </div>
    </header>
  );
}

function AnimatedBackground() {
  return (
    <>
      <div className="blob animate-blob-a -left-24 top-0 h-80 w-80 bg-violet-300/50" />
      <div className="blob animate-blob-b right-[-5rem] top-10 h-96 w-96 bg-fuchsia-200/60" />
      <div className="blob animate-blob-c bottom-[-4rem] left-1/3 h-72 w-72 bg-indigo-200/60" />
      {RISING_BOLTS.map((b, i) => (
        <span
          key={i}
          className="rise-bolt"
          style={{ left: b.left, ['--d' as string]: b.d, ['--delay' as string]: b.delay } as React.CSSProperties}
        >
          <BoltIcon className={`${b.size} fill-current`} />
        </span>
      ))}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/0 to-white/50" />
    </>
  );
}

export default function JobDetailPage() {
  const params = useParams();
  const id = String(params.id);

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showAccountHint, setShowAccountHint] = useState(false);

  const [applyMsg, setApplyMsg] = useState('');
  const [applyErr, setApplyErr] = useState('');
  const [applied, setApplied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API}/jobs/${id}`)
      .then((res) => {
        if (res.status === 404) {
          throw new Error('This job is no longer available.');
        }
        if (!res.ok) throw new Error(`Could not load the job (error ${res.status})`);
        return res.json();
      })
      .then((data: JobDetail) => {
        if (cancelled) return;
        setJob(data);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof TypeError
            ? 'Cannot reach the backend. Is it running on port 3000?'
            : err.message,
        );
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function shareJob() {
    if (!job) return;
    setNotice('');
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: job.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setNotice('Job link copied. You can paste it anywhere to share.');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setNotice('Could not share automatically. Copy the address from the browser.');
    }
  }

  async function apply() {
    setApplyErr('');
    setApplyMsg('');
    const token = localStorage.getItem('skilho_token');
    if (!token) {
      setShowAccountHint(true);
      return;
    }
    try {
      const res = await fetch(`${API}/jobs/${job!.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;
        throw new Error(msg || 'Could not apply');
      }
      setApplied(true);
      setApplyMsg('Application submitted!');
    } catch (err) {
      setApplyErr(err instanceof Error ? err.message : 'Could not apply');
    }
  }

  async function toggleSave() {
    setApplyErr('');
    const token = localStorage.getItem('skilho_token');
    if (!token) {
      setShowAccountHint(true);
      return;
    }
    try {
      const res = await fetch(`${API}/jobs/${job!.id}/save`, {
        method: saved ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Could not save job');
      setSaved(!saved);
    } catch (err) {
      setApplyErr(err instanceof Error ? err.message : 'Could not save job');
    }
  }

  /* ---------- loading ---------- */
  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <section className="hero-bg hero-bg-pan relative overflow-hidden border-b border-violet-100">
          <AnimatedBackground />
          <div
            className="relative mx-auto max-w-7xl animate-pulse space-y-4 px-6 py-12"
            aria-label="Loading job"
          >
            <div className="h-4 w-28 rounded bg-violet-100" />
            <div className="h-56 rounded-2xl bg-white/80" />
          </div>
        </section>
        <div className="mx-auto max-w-7xl animate-pulse px-6 py-10">
          <div className="h-72 rounded-3xl bg-slate-100" />
        </div>
      </main>
    );
  }

  /* ---------- error ---------- */
  if (error || !job) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <section className="hero-bg hero-bg-pan relative min-h-[70vh] overflow-hidden">
          <AnimatedBackground />
          <div className="relative mx-auto max-w-md px-6 py-20">
            <Reveal from="zoom">
              <div className="float-card rounded-3xl p-10 text-center">
                <span className="mx-auto flex h-16 w-16 animate-floaty items-center justify-center rounded-2xl bg-red-50 text-red-500">
                  <BoltIcon className="h-8 w-8" />
                </span>
                <p role="alert" className="mt-5 text-lg font-semibold text-red-700">
                  {error || 'Job not found'}
                </p>
                <Link href="/jobs" className={`${BTN_PRIMARY} mt-6`}>
                  Browse other jobs
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
    );
  }

  const benefits: string[] = [];
  if (job.accommodationProvided) benefits.push('Accommodation provided');
  if (job.foodProvided) benefits.push('Food provided');
  if (job.travelAllowance) benefits.push('Travel allowance');
  if (job.overtimeAvailable) benefits.push('Overtime available');

  const overview: [string, string][] = [
    ['Experience', labelOf(EXPERIENCE_OPTIONS, job.experience)],
    ['Joining', labelOf(JOINING_OPTIONS, job.joiningPreference)],
    ['Work type', labelOf(WORK_TYPE_OPTIONS, job.workType)],
    ['Vacancies', String(job.vacancies)],
    ['Category', job.category],
  ];

  const companyPlace = [job.company.city, job.company.state]
    .filter(Boolean)
    .join(', ');

  const salary = salaryText(job.salaryMin, job.salaryMax, job.salaryNegotiable);

  return (
    <main className="min-h-screen overflow-x-hidden bg-white pb-24 text-slate-900 antialiased lg:pb-0">
      <Header />

      {/* ================= HERO / TITLE CARD ================= */}
      <section className="hero-bg hero-bg-pan relative overflow-hidden border-b border-violet-100">
        <AnimatedBackground />
        <div className="relative mx-auto max-w-7xl px-6 pb-12 pt-10">
          <Link href="/jobs" className="text-sm font-semibold text-violet-700 hover:underline">
            ← Back to jobs
          </Link>

          <Reveal from="zoom" className="mt-5">
            <section className="float-card rounded-3xl p-6 md:p-9">
              <div className="flex items-start gap-5">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-2xl font-extrabold text-white shadow-lg shadow-violet-500/30"
                  aria-hidden="true"
                >
                  {job.company.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-950 md:text-4xl">
                    {job.title}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-lg font-medium text-slate-700">{job.company.name}</span>
                    {job.company.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                        <Check className="h-3.5 w-3.5" /> Verified company
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                      <PinIcon />
                      {job.city}, {job.state}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                      <ClockIcon />
                      {postedText(job.publishedAt ?? job.createdAt)}
                    </span>
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-200">
                      {labelOf(WORK_TYPE_OPTIONS, job.workType)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap items-end justify-between gap-5">
                <div>
                  <p className="text-sm font-medium text-slate-500">Salary</p>
                  <p className="text-3xl font-extrabold tracking-tight text-violet-700">{salary}</p>
                </div>

                <div className="hidden flex-wrap gap-3 lg:flex">
                  <button type="button" onClick={apply} disabled={applied} className={BTN_PRIMARY}>
                    {applied ? (
                      <>
                        <Check /> Applied
                      </>
                    ) : (
                      'Apply now'
                    )}
                  </button>
                  <button type="button" onClick={toggleSave} className={BTN_OUTLINE}>
                    <span className={saved ? 'text-rose-500' : ''}>
                      <HeartIcon filled={saved} />
                    </span>
                    {saved ? 'Saved' : 'Save job'}
                  </button>
                  <button type="button" onClick={shareJob} className={BTN_OUTLINE}>
                    <ShareIcon /> Share
                  </button>
                </div>
              </div>

              {/* on small screens: save + share here, apply is in the bottom bar */}
              <div className="mt-5 flex flex-wrap gap-3 lg:hidden">
                <button type="button" onClick={toggleSave} className={BTN_OUTLINE}>
                  <span className={saved ? 'text-rose-500' : ''}>
                    <HeartIcon filled={saved} />
                  </span>
                  {saved ? 'Saved' : 'Save job'}
                </button>
                <button type="button" onClick={shareJob} className={BTN_OUTLINE}>
                  <ShareIcon /> Share
                </button>
              </div>

              <div aria-live="polite">
                {notice && <p className="mt-4 text-sm text-emerald-700">{notice}</p>}
                {applyMsg && (
                  <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    <Check /> {applyMsg}
                  </p>
                )}
                {applyErr && (
                  <p role="alert" className="mt-4 text-sm text-red-700">
                    {applyErr}
                  </p>
                )}
              </div>

              {showAccountHint && (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">Log in as a technician to continue.</p>
                  <p className="mt-1">
                    You need a technician account with a profile to apply or save jobs.{' '}
                    <Link href="/register/employee" className="font-semibold underline">
                      Create an account
                    </Link>{' '}
                    or{' '}
                    <Link href="/login/employee" className="font-semibold underline">
                      log in
                    </Link>
                    .
                  </p>
                </div>
              )}
            </section>
          </Reveal>
        </div>
      </section>

      {/* ================= BODY ================= */}
      <div className="relative overflow-hidden bg-gradient-to-b from-violet-50/40 to-white">
        <div className="blob animate-blob-b right-0 top-40 h-96 w-96 bg-violet-200/30" />
        <div className="relative mx-auto grid max-w-7xl items-start gap-6 px-6 py-10 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">
            <Reveal>
              <section className={CARD}>
                <h2 className={`${H2} mb-3`}>Job description</h2>
                <p className="max-w-prose whitespace-pre-line leading-relaxed text-slate-700">{job.description}</p>

                {job.specializations.length > 0 && (
                  <>
                    <h3 className="mb-2 mt-7 text-sm font-bold text-violet-700">
                      Technician specialization
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {job.specializations.map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-violet-50 px-3.5 py-1.5 text-sm font-medium text-violet-800 ring-1 ring-inset ring-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-100"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </section>
            </Reveal>

            {(job.workingHours || job.weeklyHolidays || benefits.length > 0) && (
              <Reveal delay={80}>
                <section className={CARD}>
                  <h2 className={`${H2} mb-5`}>Work conditions and benefits</h2>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    {job.workingHours && (
                      <div className="rounded-xl bg-slate-50 p-4">
                        <dt className="text-sm text-slate-500">Working hours</dt>
                        <dd className="mt-0.5 font-semibold text-slate-900">{job.workingHours}</dd>
                      </div>
                    )}
                    {job.weeklyHolidays && (
                      <div className="rounded-xl bg-slate-50 p-4">
                        <dt className="text-sm text-slate-500">Weekly holidays</dt>
                        <dd className="mt-0.5 font-semibold text-slate-900">{job.weeklyHolidays}</dd>
                      </div>
                    )}
                  </dl>
                  {benefits.length > 0 && (
                    <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                      {benefits.map((b) => (
                        <li
                          key={b}
                          className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-slate-800"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          <span className="font-medium">{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </Reveal>
            )}

            {(job.requiredCertificates || job.interviewProcess) && (
              <Reveal delay={80}>
                <section className={`${CARD} space-y-6`}>
                  {job.requiredCertificates && (
                    <div>
                      <h2 className={`${H2} mb-2`}>Required certificates</h2>
                      <p className="text-slate-700">{job.requiredCertificates}</p>
                    </div>
                  )}
                  {job.interviewProcess && (
                    <div>
                      <h2 className={`${H2} mb-2`}>Interview process</h2>
                      <p className="whitespace-pre-line text-slate-700">{job.interviewProcess}</p>
                    </div>
                  )}
                </section>
              </Reveal>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-28">
            <Reveal from="right">
              <section className="overflow-hidden rounded-2xl border border-white bg-white shadow-[0_20px_60px_-28px_rgba(109,40,217,0.35)]">
                <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-violet-500 to-fuchsia-500 p-6 text-white">
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15" />
                  <h2 className="text-sm font-semibold text-violet-100">Job overview</h2>
                  <p className="relative mt-2 text-2xl font-extrabold tracking-tight">{salary}</p>
                </div>
                <dl className="divide-y divide-slate-100 p-6">
                  {overview.map(([name, value]) => (
                    <div key={name} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <dt className="text-sm text-slate-500">{name}</dt>
                      <dd className="text-right text-sm font-semibold text-slate-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </Reveal>

            <Reveal from="right" delay={100}>
              <section className={CARD.replace('md:p-8', '')}>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-lg font-extrabold text-violet-700">
                    {job.company.name[0]?.toUpperCase()}
                  </span>
                  <h2 className="text-lg font-bold leading-tight text-slate-950">About {job.company.name}</h2>
                </div>
                {companyPlace && (
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
                    <PinIcon /> {companyPlace}
                  </p>
                )}
                {job.company.technicianCount != null && (
                  <p className="mt-1 text-sm text-slate-500">{job.company.technicianCount} technicians</p>
                )}
                {job.company.description && (
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                    {job.company.description}
                  </p>
                )}
              </section>
            </Reveal>

            <Reveal from="right" delay={200}>
              <section className="rounded-3xl border border-violet-100 bg-violet-50/60 p-6 text-sm text-slate-600">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
                    <ShieldIcon />
                  </span>
                  <p className="font-bold text-slate-950">Your privacy</p>
                </div>
                <p className="mt-3 leading-relaxed">
                  Your phone number and email are shared with the employer only when you apply.
                  Skilho never asks you to pay to apply for a job.
                </p>
              </section>
            </Reveal>
          </aside>
        </div>
      </div>

      {/* ================= MOBILE APPLY BAR ================= */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-950">{job.title}</p>
            <p className="truncate text-xs font-semibold text-violet-700">{salary}</p>
          </div>
          <button type="button" onClick={apply} disabled={applied} className={`${BTN_PRIMARY} px-6 py-2.5`}>
            {applied ? (
              <>
                <Check /> Applied
              </>
            ) : (
              'Apply now'
            )}
          </button>
        </div>
      </div>
    </main>
  );
}