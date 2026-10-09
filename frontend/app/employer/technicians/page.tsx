'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, MotionConfig, type Variants } from 'framer-motion';
import AuthImage from '../../components/AuthImage';
import { SKILL_LEVEL_OPTIONS, labelOf } from '../../lib/employeeOptions';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://skilho.onrender.com';

const inputClass =
  'w-full border border-slate-300 rounded-lg p-3 text-slate-900 bg-white/80 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 hover:border-slate-400';

type Filters = {
  q: string;
  skill: string;
  minYears: string;
  location: string;
  maxSalary: string;
  availability: string;
};

const EMPTY: Filters = {
  q: '',
  skill: '',
  minYears: '',
  location: '',
  maxSalary: '',
  availability: '',
};

type TechCard = {
  id: string;
  fullName: string;
  professionalTitle: string | null;
  hasPhoto: boolean;
  verified: boolean;
  city: string | null;
  state: string | null;
  totalExperienceMonths: number | null;
  expectedSalary: number | null;
  immediateJoining: boolean;
  noticePeriodDays: number | null;
  skills: { name: string; level: string }[];
};

type Result = {
  items: TechCard[];
  total: number;
  page: number;
  totalPages: number;
};

const EXPERIENCE_FILTER = [
  { value: '1', label: '1+ years' },
  { value: '2', label: '2+ years' },
  { value: '3', label: '3+ years' },
  { value: '5', label: '5+ years' },
  { value: '10', label: '10+ years' },
];

function monthsText(months: number | null) {
  if (months == null) return 'Experience not stated';
  if (months <= 0) return 'Fresher';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
  if (rest > 0) parts.push(`${rest} mo${rest > 1 ? 's' : ''}`);
  return parts.join(' ');
}

function availabilityText(tech: TechCard) {
  if (tech.immediateJoining) return 'Available immediately';
  if (tech.noticePeriodDays != null) {
    return `Notice period: ${tech.noticePeriodDays} days`;
  }
  return null;
}

/* ---------- motion helpers ---------- */

const EASE = [0.22, 1, 0.36, 1] as const;

const stagger = (gap = 0.06, delay = 0.05): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const cardIn: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
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
  @media (prefers-reduced-motion: reduce) {
    .skilho-bg-orb-1,
    .skilho-bg-orb-2,
    .skilho-bg-orb-3,
    .skilho-bg-grid {
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

function TechnicianSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [form, setForm] = useState<Filters>({ ...EMPTY, q: initialQuery });
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);
  const [skillNames, setSkillNames] = useState<string[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    setForm((prev) => ({ ...prev, q }));
    setApplied((prev) => ({ ...prev, q }));
  }, [searchParams]);

  useEffect(() => {
    const token = localStorage.getItem('skilho_token');
    if (!token) return;

    fetch(`${API}/employer/technician-search/skills`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((list: string[]) => setSkillNames(list))
      .catch(() => setSkillNames([]));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('skilho_token');
    if (!token) {
      router.replace('/login/employer');
      return;
    }
    let cancelled = false;

    const params = new URLSearchParams();
    Object.entries(applied).forEach(([key, value]) => {
      if (value.trim() !== '') params.set(key, value.trim());
    });
    params.set('page', String(page));

    fetch(`${API}/employer/technician-search?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('skilho_token');
          router.replace('/login/employer');
          throw new Error('Unauthorized');
        }
        if (res.status === 403) {
          throw new Error(
            'Only approved employer accounts can search technicians. Check your company verification status on the dashboard.',
          );
        }
        if (!res.ok) {
          throw new Error(`Could not load technicians (error ${res.status})`);
        }
        return res.json();
      })
      .then((data: Result) => {
        if (cancelled) return;
        setResult(data);
        setError('');
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled || err.message === 'Unauthorized') return;
        setResult(null);
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
  }, [applied, page, router]);

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
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatedBackground />

      <main className="min-h-screen p-6 relative">
        <div className="max-w-5xl mx-auto relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <Link
              href="/dashboard/employer"
              className="text-blue-600 text-sm inline-block transition-transform duration-200 hover:-translate-x-0.5"
            >
              ← Back to dashboard
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Search{' '}
              <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">
                Technicians
              </span>
            </h1>
            <p className="text-slate-500 mt-1">
              Find mobile and laptop technicians by skill, experience and location
            </p>
          </motion.div>

          {/* Search form */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE, delay: 0.1 }}
            className="mt-6 bg-white/80 backdrop-blur-xl border border-white/60 rounded-xl shadow-lg shadow-slate-200/50 p-6 mb-6 space-y-4 relative overflow-hidden"
          >
            {/* Top gradient accent */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-400" />

            <input
              type="text"
              placeholder="Search by name or professional title"
              value={form.q}
              onChange={(e) => setField('q', e.target.value)}
              className={inputClass}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Skill</label>
                <select
                  value={form.skill}
                  onChange={(e) => setField('skill', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Any</option>
                  {skillNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Minimum experience
                </label>
                <select
                  value={form.minYears}
                  onChange={(e) => setField('minYears', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Any</option>
                  {EXPERIENCE_FILTER.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Availability
                </label>
                <select
                  value={form.availability}
                  onChange={(e) => setField('availability', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Any</option>
                  <option value="immediate">Available immediately</option>
                  <option value="within30">Can join within 30 days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Location (city, state or preferred location)
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setField('location', e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Maximum expected salary per month (Rs.)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.maxSalary}
                  onChange={(e) => setField('maxSalary', e.target.value)}
                  className={inputClass}
                />
                <p className="text-slate-400 text-xs mt-1">
                  Technicians who have not stated a salary are hidden when this is
                  used.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                type="submit"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                className="relative rounded-lg px-6 py-3 font-semibold text-white shadow-md shadow-blue-500/30 bg-gradient-to-r from-blue-600 via-blue-600 to-violet-600 hover:shadow-lg hover:shadow-blue-500/40 transition-shadow"
              >
                Search technicians
              </motion.button>
              <button
                type="button"
                onClick={clearFilters}
                className="border border-slate-300 rounded-lg px-6 py-3 text-slate-700 bg-white/70 hover:bg-white transition-colors"
              >
                Clear
              </button>
            </div>
          </motion.form>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="rounded-xl p-5 mb-4 bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700"
            >
              {error}
            </motion.div>
          )}

          {loading && (
            <div className="flex items-center gap-3 text-slate-500">
              <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
              Loading technicians...
            </div>
          )}

          {!loading && result && (
            <>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="text-slate-600 mb-4"
              >
                <span className="font-semibold text-slate-900">
                  {result.total}
                </span>{' '}
                {result.total === 1 ? 'technician' : 'technicians'} found
              </motion.p>

              {result.items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-xl shadow-lg shadow-slate-200/50 p-6 text-slate-500"
                >
                  No technicians match your search. Try removing some filters.
                </motion.div>
              ) : (
                <motion.ul
                  className="space-y-4"
                  variants={stagger(0.06, 0.05)}
                  initial="hidden"
                  animate="show"
                >
                  {result.items.map((tech) => {
                    const initial = (tech.fullName.trim()[0] ?? 'T').toUpperCase();
                    const place = [tech.city, tech.state]
                      .filter(Boolean)
                      .join(', ');
                    const availability = availabilityText(tech);

                    return (
                      <motion.li key={tech.id} variants={cardIn}>
                        <Link
                          href={`/employer/technicians/${tech.id}`}
                          className="group relative flex gap-5 bg-white/85 backdrop-blur-xl border border-white/60 rounded-xl shadow-md shadow-slate-200/50 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-blue-200/40 hover:-translate-y-1 overflow-hidden"
                        >
                          {/* Hover gradient sheen */}
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-blue-50/70 via-transparent to-violet-50/70"
                          />
                          {/* Left accent */}
                          <span
                            aria-hidden
                            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 via-violet-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          />

                          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 shrink-0 flex items-center justify-center ring-2 ring-white shadow-sm">
                            {tech.hasPhoto ? (
                              <AuthImage
                                url={`${API}/employer/technicians/${tech.id}/photo`}
                                tokenKey="skilho_token"
                                alt={tech.fullName}
                                className="w-16 h-16 object-cover"
                                fallback={
                                  <span className="text-2xl font-bold text-slate-500">
                                    {initial}
                                  </span>
                                }
                              />
                            ) : (
                              <span className="text-2xl font-bold text-slate-500">
                                {initial}
                              </span>
                            )}
                          </div>

                          <div className="relative min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
                                {tech.fullName}
                              </h2>
                              {tech.verified && (
                                <span className="bg-gradient-to-r from-emerald-100 to-green-100 text-green-800 text-xs font-semibold rounded-full px-2.5 py-1 border border-emerald-200">
                                  ✔ Verified technician
                                </span>
                              )}
                            </div>
                            {tech.professionalTitle && (
                              <p className="text-slate-600">
                                {tech.professionalTitle}
                              </p>
                            )}
                            <p className="text-slate-700 text-sm mt-2">
                              {monthsText(tech.totalExperienceMonths)}
                              {place ? ` · ${place}` : ''}
                              {tech.expectedSalary != null
                                ? ` · Expects Rs. ${tech.expectedSalary.toLocaleString('en-IN')} / month`
                                : ''}
                              {availability ? ` · ${availability}` : ''}
                            </p>

                            {tech.skills.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {tech.skills.map((s) => (
                                  <span
                                    key={s.name}
                                    className="bg-gradient-to-r from-blue-50 to-violet-50 text-blue-700 text-xs rounded-full px-3 py-1 border border-blue-100 transition-transform duration-200 hover:scale-105"
                                  >
                                    {s.name} ·{' '}
                                    {labelOf(SKILL_LEVEL_OPTIONS, s.level)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Right chevron */}
                          <span
                            aria-hidden
                            className="ml-auto self-center text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300 text-xl"
                          >
                            ›
                          </span>
                        </Link>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              )}

              {result.totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="flex items-center justify-center gap-4 mt-6"
                >
                  <button
                    disabled={result.page <= 1}
                    onClick={() => goToPage(result.page - 1)}
                    className="border border-slate-300 bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 text-slate-700 disabled:opacity-40 hover:bg-white transition-colors"
                  >
                    ← Previous
                  </button>
                  <span className="text-slate-600">
                    Page <span className="font-semibold text-slate-900">{result.page}</span> of{' '}
                    {result.totalPages}
                  </span>
                  <button
                    disabled={result.page >= result.totalPages}
                    onClick={() => goToPage(result.page + 1)}
                    className="border border-slate-300 bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 text-slate-700 disabled:opacity-40 hover:bg-white transition-colors"
                  >
                    Next →
                  </button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </main>
    </MotionConfig>
  );
}

export default function TechnicianSearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading technicians...</div>}>
      <TechnicianSearchContent />
    </Suspense>
  );
}
