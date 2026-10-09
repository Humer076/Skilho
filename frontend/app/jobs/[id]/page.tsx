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

const API = process.env.NEXT_PUBLIC_API_URL || 'https://skilho.onrender.com';

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
  'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6';
const H2 = 'text-base font-bold tracking-tight text-slate-950 sm:text-lg';
const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-600/20 transition-all duration-200 hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-600/25 focus:outline-none focus:ring-4 focus:ring-violet-500/20 active:scale-[0.98] disabled:cursor-default disabled:bg-emerald-600 disabled:shadow-emerald-600/20';
const BTN_OUTLINE =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-500/10 active:scale-[0.98]';

const RISING_BOLTS = [
  { left: '8%', d: '16s', delay: '0s', size: 'h-5 w-5' },
  { left: '30%', d: '20s', delay: '5s', size: 'h-6 w-6' },
  { left: '55%', d: '15s', delay: '9s', size: 'h-4 w-4' },
  { left: '78%', d: '19s', delay: '3s', size: 'h-6 w-6' },
  { left: '94%', d: '17s', delay: '7s', size: 'h-5 w-5' },
];

/* ---------- icons ---------- */
function Svg({
  children,
  className = 'h-5 w-5',
}: {
  children: React.ReactNode;
  className?: string;
}) {
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
  <Svg className="h-5 w-5">
    <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z" />
    <path d="M9 12l2 2 4-4" />
  </Svg>
);
const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    className="h-[18px] w-[18px]"
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
  <Svg className="h-[18px] w-[18px]">
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <circle cx="18" cy="18" r="2.5" />
    <path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6" />
  </Svg>
);

/* ---------- shared pieces ---------- */
function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center"
          aria-label="Skilho home"
        >
          <img
            src="/skilho-logo.png"
            alt="Skilho"
            className="h-8 w-auto object-contain transition-transform duration-200 hover:scale-[1.03] sm:h-9"
          />
        </Link>
      </div>
    </header>
  );
}

function AnimatedBackground() {
  return (
    <>
      <div className="blob animate-blob-a -left-24 top-0 h-72 w-72 bg-violet-300/40" />
      <div className="blob animate-blob-b right-[-5rem] top-10 h-80 w-80 bg-fuchsia-200/50" />
      <div className="blob animate-blob-c bottom-[-4rem] left-1/3 h-64 w-64 bg-indigo-200/50" />
      {RISING_BOLTS.map((b, i) => (
        <span
          key={i}
          className="rise-bolt"
          style={
            {
              left: b.left,
              ['--d' as string]: b.d,
              ['--delay' as string]: b.delay,
            } as React.CSSProperties
          }
        >
          <BoltIcon className={`${b.size} fill-current`} />
        </span>
      ))}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/0 to-white/60" />
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
        if (!res.ok)
          throw new Error(`Could not load the job (error ${res.status})`);
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
      setNotice(
        'Could not share automatically. Copy the address from the browser.',
      );
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
            className="relative mx-auto max-w-7xl animate-pulse space-y-4 px-4 py-10 sm:px-6 lg:px-8"
            aria-label="Loading job"
          >
            <div className="h-3.5 w-24 rounded bg-violet-100" />
            <div className="h-48 rounded-2xl bg-white/80" />
          </div>
        </section>
        <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-64 rounded-2xl bg-slate-100" />
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
          <div className="relative mx-auto max-w-md px-4 py-16 sm:px-6">
            <Reveal from="zoom">
              <div className="float-card rounded-2xl p-8 text-center">
                <span className="mx-auto flex h-14 w-14 animate-floaty items-center justify-center rounded-2xl bg-red-50 text-red-500">
                  <BoltIcon className="h-7 w-7" />
                </span>
                <p
                  role="alert"
                  className="mt-4 text-base font-semibold text-red-700"
                >
                  {error || 'Job not found'}
                </p>
                <Link href="/jobs" className={`${BTN_PRIMARY} mt-5`}>
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

  const salary = salaryText(
    job.salaryMin,
    job.salaryMax,
    job.salaryNegotiable,
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-white pb-24 text-slate-900 antialiased lg:pb-0">
      <Header />

      {/* ================= HERO / TITLE CARD ================= */}
      <section className="hero-bg hero-bg-pan relative overflow-hidden border-b border-violet-100">
        <AnimatedBackground />
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
          <Reveal from="zoom">
            <section className="float-card rounded-2xl p-5 sm:p-7">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xl font-extrabold text-white shadow-lg shadow-violet-500/30"
                  aria-hidden="true"
                >
                  {job.company.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-3xl">
                    {job.title}
                  </h1>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-base font-medium text-slate-700">
                      {job.company.name}
                    </span>
                    {job.company.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                        <Check className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                      <PinIcon />
                      {job.city}, {job.state}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                      <ClockIcon />
                      {postedText(job.publishedAt ?? job.createdAt)}
                    </span>
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 ring-1 ring-inset ring-violet-200 sm:text-xs">
                      {labelOf(WORK_TYPE_OPTIONS, job.workType)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 sm:text-sm">
                    Salary
                  </p>
                  <p className="text-2xl font-extrabold tracking-tight text-violet-700 sm:text-3xl">
                    {salary}
                  </p>
                </div>

                <div className="hidden flex-wrap gap-2.5 lg:flex">
                  <button
                    type="button"
                    onClick={apply}
                    disabled={applied}
                    className={BTN_PRIMARY}
                  >
                    {applied ? (
                      <>
                        <Check /> Applied
                      </>
                    ) : (
                      'Apply now'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={toggleSave}
                    className={BTN_OUTLINE}
                  >
                    <span className={saved ? 'text-rose-500' : ''}>
                      <HeartIcon filled={saved} />
                    </span>
                    {saved ? 'Saved' : 'Save job'}
                  </button>
                  <button
                    type="button"
                    onClick={shareJob}
                    className={BTN_OUTLINE}
                  >
                    <ShareIcon /> Share
                  </button>
                </div>
              </div>

              {/* on small screens: save + share here, apply is in the bottom bar */}
              <div className="mt-4 flex flex-wrap gap-2.5 lg:hidden">
                <button
                  type="button"
                  onClick={toggleSave}
                  className={BTN_OUTLINE}
                >
                  <span className={saved ? 'text-rose-500' : ''}>
                    <HeartIcon filled={saved} />
                  </span>
                  {saved ? 'Saved' : 'Save job'}
                </button>
                <button
                  type="button"
                  onClick={shareJob}
                  className={BTN_OUTLINE}
                >
                  <ShareIcon /> Share
                </button>
              </div>

              <div aria-live="polite">
                {notice && (
                  <p className="mt-4 text-sm text-emerald-700">{notice}</p>
                )}
                {applyMsg && (
                  <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
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
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">
                    Log in as a technician to continue.
                  </p>
                  <p className="mt-1">
                    You need a technician account with a profile to apply or
                    save jobs.{' '}
                    <Link
                      href="/register/employee"
                      className="font-semibold underline"
                    >
                      Create an account
                    </Link>{' '}
                    or{' '}
                    <Link
                      href="/login/employee"
                      className="font-semibold underline"
                    >
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
        <div className="blob animate-blob-b right-0 top-40 h-80 w-80 bg-violet-200/30" />
        <div className="relative mx-auto grid max-w-7xl items-start gap-5 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:gap-6 lg:px-8">
          {/* Main column */}
          <div className="space-y-5 lg:col-span-2">
            <Reveal>
              <section className={CARD}>
                <h2 className={`${H2} mb-3`}>Job description</h2>
                <p className="max-w-prose whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {job.description}
                </p>

                {job.specializations.length > 0 && (
                  <>
                    <h3 className="mb-2 mt-6 text-xs font-bold uppercase tracking-wide text-violet-700">
                      Technician specialization
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {job.specializations.map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-800 ring-1 ring-inset ring-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-100"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </section>
            </Reveal>

            {(job.workingHours ||
              job.weeklyHolidays ||
              benefits.length > 0) && (
              <Reveal delay={80}>
                <section className={CARD}>
                  <h2 className={`${H2} mb-4`}>
                    Work conditions and benefits
                  </h2>
                  <dl className="grid gap-3 sm:grid-cols-2">
                    {job.workingHours && (
                      <div className="rounded-xl bg-slate-50 p-3.5">
                        <dt className="text-xs text-slate-500">
                          Working hours
                        </dt>
                        <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                          {job.workingHours}
                        </dd>
                      </div>
                    )}
                    {job.weeklyHolidays && (
                      <div className="rounded-xl bg-slate-50 p-3.5">
                        <dt className="text-xs text-slate-500">
                          Weekly holidays
                        </dt>
                        <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                          {job.weeklyHolidays}
                        </dd>
                      </div>
                    )}
                  </dl>
                  {benefits.length > 0 && (
                    <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                      {benefits.map((b) => (
                        <li
                          key={b}
                          className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3.5 py-2.5 text-sm text-slate-800"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                            <Check className="h-3 w-3" />
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
                <section className={`${CARD} space-y-5`}>
                  {job.requiredCertificates && (
                    <div>
                      <h2 className={`${H2} mb-2`}>
                        Required certificates
                      </h2>
                      <p className="text-sm text-slate-700">
                        {job.requiredCertificates}
                      </p>
                    </div>
                  )}
                  {job.interviewProcess && (
                    <div>
                      <h2 className={`${H2} mb-2`}>Interview process</h2>
                      <p className="whitespace-pre-line text-sm text-slate-700">
                        {job.interviewProcess}
                      </p>
                    </div>
                  )}
                </section>
              </Reveal>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-24">
            <Reveal from="right">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-violet-500 to-fuchsia-500 p-5 text-white">
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/15" />
                  <h2 className="text-xs font-semibold text-violet-100">
                    Job overview
                  </h2>
                  <p className="relative mt-1.5 text-xl font-extrabold tracking-tight sm:text-2xl">
                    {salary}
                  </p>
                </div>
                <dl className="divide-y divide-slate-100 p-5">
                  {overview.map(([name, value]) => (
                    <div
                      key={name}
                      className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                    >
                      <dt className="text-xs text-slate-500 sm:text-sm">
                        {name}
                      </dt>
                      <dd className="text-right text-xs font-semibold text-slate-900 sm:text-sm">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            </Reveal>

            <Reveal from="right" delay={100}>
              <section className={CARD}>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-base font-extrabold text-violet-700">
                    {job.company.name[0]?.toUpperCase()}
                  </span>
                  <h2 className="text-base font-bold leading-tight text-slate-950 sm:text-lg">
                    About {job.company.name}
                  </h2>
                </div>
                {companyPlace && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 sm:text-sm">
                    <PinIcon /> {companyPlace}
                  </p>
                )}
                {job.company.technicianCount != null && (
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    {job.company.technicianCount} technicians
                  </p>
                )}
                {job.company.description && (
                  <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-slate-700 sm:text-sm">
                    {job.company.description}
                  </p>
                )}
              </section>
            </Reveal>

            <Reveal from="right" delay={200}>
              <section className="rounded-2xl border border-violet-100 bg-violet-50/60 p-5 text-xs text-slate-600 sm:text-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
                    <ShieldIcon />
                  </span>
                  <p className="font-bold text-slate-950">Your privacy</p>
                </div>
                <p className="mt-3 leading-relaxed">
                  Your phone number and email are shared with the employer
                  only when you apply. Skilho never asks you to pay to apply
                  for a job.
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
            <p className="truncate text-sm font-bold text-slate-950">
              {job.title}
            </p>
            <p className="truncate text-xs font-semibold text-violet-700">
              {salary}
            </p>
          </div>
          <button
            type="button"
            onClick={apply}
            disabled={applied}
            className={`${BTN_PRIMARY} px-5 py-2.5`}
          >
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
