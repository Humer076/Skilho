 'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Reveal from '../components/Reveal';
import {
  EXPERIENCE_OPTIONS,
  JOINING_OPTIONS,
  SPECIALIZATIONS,
  WORK_TYPE_OPTIONS,
  labelOf,
} from '../lib/jobOptions';
import { postedText, salaryText } from '../lib/jobFormat';

const API = 'http://localhost:3000';

type Filters = {
  q: string;
  specialization: string;
  experience: string;
  joining: string;
  location: string;
  minSalary: string;
};

const EMPTY: Filters = {
  q: '',
  specialization: '',
  experience: '',
  joining: '',
  location: '',
  minSalary: '',
};

type JobCard = {
  id: string;
  title: string;
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
  publishedAt: string | null;
  createdAt: string;
  company: { name: string; verified: boolean };
};

type Result = {
  items: JobCard[];
  total: number;
  page: number;
  totalPages: number;
};

const FORM_ID = 'jobs-form';

/* shared style strings */
const FIELD =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[0.95rem] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/15';
const LABEL = 'mb-1.5 block text-sm font-semibold text-slate-700';
const BTN_PRIMARY =
  'btn-shine inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-700 active:scale-[0.98]';
const BTN_OUTLINE =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-semibold text-slate-800 transition hover:border-violet-300 hover:bg-violet-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40';

const RISING_BOLTS = [
  { left: '5%', d: '14s', delay: '0s', size: 'h-6 w-6' },
  { left: '24%', d: '18s', delay: '4s', size: 'h-8 w-8' },
  { left: '48%', d: '13s', delay: '8s', size: 'h-5 w-5' },
  { left: '68%', d: '17s', delay: '2s', size: 'h-7 w-7' },
  { left: '92%', d: '15s', delay: '6s', size: 'h-6 w-6' },
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
const SearchIcon = () => (
  <Svg>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Svg>
);
const PinIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <Svg className={className}>
    <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </Svg>
);
const CheckIcon = () => (
  <Svg className="h-3.5 w-3.5">
    <path d="M5 12l5 5 9-10" />
  </Svg>
);
const FilterIcon = () => (
  <Svg>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </Svg>
);

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(12,16,19,.04),0_10px_28px_-14px_rgba(15,88,112,.14)] bg-white p-6" aria-hidden="true">
      <div className="flex gap-4">
        <div className="h-14 w-14 rounded-2xl bg-violet-100" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-1/2 rounded bg-slate-200" />
          <div className="h-4 w-1/3 rounded bg-slate-100" />
          <div className="h-4 w-2/3 rounded bg-slate-100" />
          <div className="flex gap-2 pt-2">
            <div className="h-6 w-20 rounded-full bg-violet-50" />
            <div className="h-6 w-24 rounded-full bg-violet-50" />
            <div className="h-6 w-16 rounded-full bg-violet-50" />
          </div>
        </div>
      </div>
    </div>
  );
}

function JobsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [form, setForm] = useState<Filters>({ ...EMPTY, q: initialQuery });
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // null = logged out (or not checked yet)
  const [role, setRole] = useState<'employee' | 'employer' | null>(null);

  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    setForm((prev) => ({ ...prev, q }));
    setApplied((prev) => ({ ...prev, q }));
  }, [searchParams]);

  // Check whether the visitor is logged in, so we can show a dashboard link
  useEffect(() => {
    const token = localStorage.getItem('skilho_token');
    if (!token) return;
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => {
        if (me?.role === 'EMPLOYER') setRole('employer');
        else if (me?.role === 'EMPLOYEE') setRole('employee');
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams();
    Object.entries(applied).forEach(([key, value]) => {
      if (value.trim() !== '') params.set(key, value.trim());
    });
    params.set('page', String(page));

    fetch(`${API}/jobs?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load jobs (error ${res.status})`);
        return res.json();
      })
      .then((data: Result) => {
        if (cancelled) return;
        setResult(data);
        setError('');
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
  }, [applied, page]);

  function setField(key: keyof Filters, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setPage(1);
    setApplied(form);
  }

  function clearFilters() {
    setLoading(true);
    setForm(EMPTY);
    setApplied(EMPTY);
    setPage(1);
  }

  function goToPage(next: number) {
    setLoading(true);
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const activeCount = Object.values(applied).filter((v) => v.trim() !== '').length;
  const backHref = role ? `/dashboard/${role}` : '/';

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900 antialiased">
      {/* ================= HEADER ================= */}
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
            {/* Employers and logged-out visitors see "Post a job"; technicians don't need it */}
            {role !== 'employee' && (
              <Link
                href={role === 'employer' ? '/employer/jobs' : '/register/employer'}
                className="transition hover:text-violet-600"
              >
                Post a job
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {role ? (
              <Link
                href={`/dashboard/${role}`}
                className="btn-shine inline-flex items-center rounded-lg bg-violet-600 px-5 py-2.5 font-semibold text-white transition hover:bg-violet-700"
              >
                My dashboard
              </Link>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </header>

      {/* ================= HERO + SEARCH ================= */}
      <section className="hero-bg hero-bg-pan relative overflow-hidden border-b border-violet-100">
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

        <div className="relative mx-auto max-w-5xl px-6 pb-14 pt-12 text-center">
          <Link href={backHref} className="text-sm font-semibold text-violet-700 hover:underline">
            {role ? '← Back to dashboard' : '← Back to home'}
          </Link>

          <div className="mt-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-violet-100/90 px-4 py-1.5 text-sm font-semibold text-violet-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-600" />
              </span>
              Verified companies only
            </span>
          </div>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-950 sm:text-5xl md:text-6xl">
            Find your next <span className="text-shimmer">technician job</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-500 md:text-xl">
            Mobile and laptop repair jobs from verified companies.
          </p>

          {/* search bar */}
          <form
            id={FORM_ID}
            onSubmit={handleSearch}
            className="float-card mx-auto mt-9 flex max-w-4xl flex-col gap-2 rounded-2xl p-2.5 sm:flex-row"
          >
            <label className="flex flex-1 items-center gap-2.5 rounded-xl px-4 text-slate-400 transition focus-within:bg-violet-50/60 focus-within:text-violet-600">
              <SearchIcon />
              <span className="sr-only">Search by job title, skill or company</span>
              <input
                type="text"
                placeholder="Search by job title, skill or company"
                value={form.q}
                onChange={(e) => setField('q', e.target.value)}
                className="w-full bg-transparent py-3.5 text-[0.95rem] text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>
            <label className="flex items-center gap-2.5 rounded-xl px-4 text-slate-400 transition focus-within:bg-violet-50/60 focus-within:text-violet-600 sm:w-64 sm:border-l sm:border-slate-200">
              <PinIcon className="h-5 w-5" />
              <span className="sr-only">Location (city or state)</span>
              <input
                type="text"
                placeholder="City or state"
                value={form.location}
                onChange={(e) => setField('location', e.target.value)}
                className="w-full bg-transparent py-3.5 text-[0.95rem] text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>
            <button type="submit" className={`${BTN_PRIMARY} sm:px-8`}>
              Search jobs
            </button>
          </form>
        </div>
      </section>

      {/* ================= FILTERS + RESULTS ================= */}
      <div className="relative bg-gradient-to-b from-violet-50/40 to-white">
        <div className="blob animate-blob-b right-0 top-40 h-96 w-96 bg-violet-200/30" />
        <div className="relative mx-auto grid max-w-7xl items-start gap-8 px-6 py-12 lg:grid-cols-4">
          {/* Filters (submit the same form as the search bar) */}
          <Reveal from="left" className="lg:col-span-1 lg:sticky lg:top-28">
            <aside className="rounded-2xl border border-white bg-white p-6 shadow-[0_20px_60px_-28px_rgba(109,40,217,0.35)]">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                      <FilterIcon />
                    </span>
                    Filters
                  </h2>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm font-semibold text-violet-700 hover:underline"
                  >
                    Clear all
                  </button>
                </div>

                <div>
                  <label htmlFor="specialization" className={LABEL}>
                    Specialization
                  </label>
                  <select
                    id="specialization"
                    form={FORM_ID}
                    value={form.specialization}
                    onChange={(e) => setField('specialization', e.target.value)}
                    className={FIELD}
                  >
                    <option value="">Any</option>
                    {SPECIALIZATIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="experience" className={LABEL}>
                    Experience
                  </label>
                  <select
                    id="experience"
                    form={FORM_ID}
                    value={form.experience}
                    onChange={(e) => setField('experience', e.target.value)}
                    className={FIELD}
                  >
                    <option value="">Any</option>
                    {EXPERIENCE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="joining" className={LABEL}>
                    Joining preference
                  </label>
                  <select
                    id="joining"
                    form={FORM_ID}
                    value={form.joining}
                    onChange={(e) => setField('joining', e.target.value)}
                    className={FIELD}
                  >
                    <option value="">Any</option>
                    {JOINING_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="minSalary" className={LABEL}>
                    Minimum salary per month (₹)
                  </label>
                  <input
                    id="minSalary"
                    form={FORM_ID}
                    type="number"
                    min={0}
                    placeholder="e.g. 15000"
                    value={form.minSalary}
                    onChange={(e) => setField('minSalary', e.target.value)}
                    className={FIELD}
                  />
                </div>

                <button type="submit" form={FORM_ID} className={`${BTN_PRIMARY} w-full`}>
                  Apply filters
                </button>
              </div>
            </aside>
          </Reveal>

          {/* Results */}
          <section className="lg:col-span-3" aria-live="polite">
            {error && (
              <div
                role="alert"
                className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {loading && (
              <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            )}

            {!loading && result && (
              <>
                <p className="mb-5 text-sm text-slate-600">
                  <span className="rounded-md bg-violet-100 px-2 py-0.5 font-bold text-violet-700">{result.total}</span>{' '}
                  {result.total === 1 ? 'job' : 'jobs'} found
                  {activeCount > 0 && ` · ${activeCount} ${activeCount === 1 ? 'filter' : 'filters'} applied`}
                </p>

                {result.items.length === 0 ? (
                  <Reveal from="zoom">
                    <div className="float-card rounded-3xl p-12 text-center">
                      <span className="mx-auto flex h-16 w-16 animate-floaty items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                        <BoltIcon className="h-8 w-8" />
                      </span>
                      <h2 className="mt-5 text-xl font-bold text-slate-950">No jobs match your search</h2>
                      <p className="mt-2 text-slate-500">Try removing some filters or searching a nearby city.</p>
                      <button type="button" onClick={clearFilters} className={`${BTN_OUTLINE} mt-6`}>
                        Clear all filters
                      </button>
                    </div>
                  </Reveal>
                ) : (
                  <ul className="space-y-5">
                    {result.items.map((job, i) => (
                      <li key={job.id}>
                        <Reveal delay={(i % 5) * 70}>
                          <Link
                            href={`/jobs/${job.id}`}
                            className="group block rounded-2xl ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(12,16,19,.04),0_10px_28px_-14px_rgba(15,88,112,.14)] bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-violet-200 hover:shadow-2xl hover:shadow-violet-500/15"
                          >
                            <div className="flex items-start gap-4">
                              <div
                                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xl font-extrabold text-white shadow-md shadow-violet-500/30 transition duration-300 group-hover:rotate-6 group-hover:scale-105"
                                aria-hidden="true"
                              >
                                {job.company.name[0]?.toUpperCase()}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                                  <h2 className="text-xl font-bold leading-snug tracking-tight text-slate-950 transition group-hover:text-violet-700">
                                    {job.title}
                                  </h2>
                                  <span className="whitespace-nowrap pt-1 text-xs text-slate-400">
                                    {postedText(job.publishedAt ?? job.createdAt)}
                                  </span>
                                </div>

                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <span className="font-medium text-slate-600">{job.company.name}</span>
                                  {job.company.verified && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                      <CheckIcon />
                                      Verified company
                                    </span>
                                  )}
                                </div>

                                <p className="mt-3 text-lg font-bold text-slate-950">
                                  {salaryText(job.salaryMin, job.salaryMax, job.salaryNegotiable)}
                                </p>

                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                    <PinIcon className="h-3.5 w-3.5" />
                                    {job.city}, {job.state}
                                  </span>
                                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-200">
                                    {labelOf(WORK_TYPE_OPTIONS, job.workType)}
                                  </span>
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                    Experience: {labelOf(EXPERIENCE_OPTIONS, job.experience)}
                                  </span>
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                    Joining: {labelOf(JOINING_OPTIONS, job.joiningPreference)}
                                  </span>
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                    {job.vacancies} {job.vacancies === 1 ? 'vacancy' : 'vacancies'}
                                  </span>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                                  <div className="flex flex-wrap gap-2">
                                    {job.specializations.slice(0, 4).map((s) => (
                                      <span
                                        key={s}
                                        className="rounded-md bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800"
                                      >
                                        {s}
                                      </span>
                                    ))}
                                    {job.specializations.length > 4 && (
                                      <span className="py-1 text-xs text-slate-500">
                                        +{job.specializations.length - 4} more
                                      </span>
                                    )}
                                  </div>
                                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700">
                                    View details &amp; apply
                                    <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </Reveal>
                      </li>
                    ))}
                  </ul>
                )}

                {result.totalPages > 1 && (
                  <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-4">
                    <button
                      type="button"
                      disabled={result.page <= 1}
                      onClick={() => goToPage(result.page - 1)}
                      className={BTN_OUTLINE}
                    >
                      ← Previous
                    </button>
                    <span className="rounded-full bg-violet-100 px-4 py-1.5 text-sm font-semibold text-violet-700">
                      Page {result.page} of {result.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={result.page >= result.totalPages}
                      onClick={() => goToPage(result.page + 1)}
                      className={BTN_OUTLINE}
                    >
                      Next →
                    </button>
                  </nav>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading jobs...</div>}>
      <JobsContent />
    </Suspense>
  );
}