'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, MotionConfig, type Variants } from 'framer-motion';
import Icon from '../../components/Icon';

const API = 'http://localhost:3000';

const SPECIALIZATIONS = [
  'Android',
  'iPhone',
  'Laptop Hardware',
  'Laptop Software',
  'Chip-Level Repair',
  'Motherboard Repair',
  'IC-Level Repair',
  'Microsoldering',
  'BIOS Programming',
  'MacBook Repair',
];

type Field = { key: string; label: string; type?: 'text' | 'number' | 'textarea' };

const COMPANY_FIELDS: Field[] = [
  { key: 'companyName', label: 'Company name *' },
  { key: 'legalName', label: 'Legal name' },
  { key: 'website', label: 'Website' },
  { key: 'companyEmail', label: 'Company email' },
  { key: 'companyPhone', label: 'Company phone' },
  { key: 'companyType', label: 'Company type (repair shop, service center...)' },
  { key: 'establishedYear', label: 'Establishment year', type: 'number' },
  { key: 'registrationDetails', label: 'Registration details' },
  { key: 'gstNumber', label: 'GST number (if applicable)' },
  { key: 'address', label: 'Complete address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'pincode', label: 'Pincode' },
  { key: 'employeeCount', label: 'Number of employees', type: 'number' },
  { key: 'technicianCount', label: 'Number of technicians', type: 'number' },
  { key: 'branchCount', label: 'Number of branches', type: 'number' },
];

const PERSON_FIELDS: Field[] = [
  { key: 'authorizedName', label: 'Full name' },
  { key: 'authorizedDesignation', label: 'Designation' },
  { key: 'authorizedMobile', label: 'Mobile number' },
  { key: 'authorizedEmail', label: 'Email' },
];

const DESCRIPTION_FIELD: Field = {
  key: 'description',
  label: 'Company description',
  type: 'textarea',
};

const ALL_FIELDS: Field[] = [
  ...COMPANY_FIELDS,
  DESCRIPTION_FIELD,
  ...PERSON_FIELDS,
];

/* ---------- motion helpers ---------- */

const EASE = [0.22, 1, 0.36, 1] as const;

const stagger = (gap = 0.08, delay = 0.05): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const chipIn: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: EASE } },
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
    <main className="min-h-screen relative">
      <AnimatedBackground />
      <div className="relative z-10">
        <div className="bg-white/70 backdrop-blur-xl border-b border-slate-200 px-6 lg:px-10 py-6">
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="skilho-shimmer h-3 w-40 rounded-full" />
            <div className="flex items-center gap-3 mt-3">
              <div className="skilho-shimmer h-10 w-10 rounded-xl" />
              <div className="skilho-shimmer h-7 w-56 rounded-full" />
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto p-6 lg:p-10 space-y-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-xl shadow-lg shadow-slate-200/50 p-6 space-y-4"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="skilho-shimmer h-5 w-1/3 rounded-full" />
              <div className="grid gap-5 md:grid-cols-2">
                <div className="skilho-shimmer h-12 rounded-xl" />
                <div className="skilho-shimmer h-12 rounded-xl" />
                <div className="skilho-shimmer h-12 rounded-xl" />
                <div className="skilho-shimmer h-12 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function EmployerProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({});
  const [specs, setSpecs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('skilho_token');
    if (!token) {
      router.replace('/login/employer');
      return;
    }

    fetch(`${API}/employer/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => {
        const values: Record<string, string> = {};
        ALL_FIELDS.forEach((f) => {
          values[f.key] = data[f.key] != null ? String(data[f.key]) : '';
        });
        setForm(values);
        setSpecs(data.specializations ?? []);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('skilho_token');
        router.replace('/login/employer');
      });
  }, [router]);

  function setValue(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSpec(name: string) {
    setSpecs((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      const token = localStorage.getItem('skilho_token');
      const payload: Record<string, unknown> = { specializations: specs };

      ALL_FIELDS.forEach((f) => {
        const value = (form[f.key] ?? '').trim();
        if (value === '') payload[f.key] = null;
        else if (f.type === 'number') payload[f.key] = Number(value);
        else payload[f.key] = value;
      });

      const res = await fetch(`${API}/employer/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;
        throw new Error(msg || 'Could not save profile');
      }

      setMessage('Profile saved successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  }

  function renderField(f: Field) {
    return (
      <div key={f.key} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
        <label className="label-premium">{f.label}</label>
        {f.type === 'textarea' ? (
          <textarea
            rows={4}
            value={form[f.key] ?? ''}
            onChange={(e) => setValue(f.key, e.target.value)}
            className="input-premium"
          />
        ) : (
          <input
            type={f.type === 'number' ? 'number' : 'text'}
            min={f.type === 'number' ? 0 : undefined}
            required={f.key === 'companyName'}
            value={form[f.key] ?? ''}
            onChange={(e) => setValue(f.key, e.target.value)}
            className="input-premium"
          />
        )}
      </div>
    );
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatedBackground />

      <main className="min-h-screen relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="relative z-10 bg-white/70 backdrop-blur-xl border-b border-slate-200 px-6 lg:px-10 py-6"
        >
          <div className="max-w-3xl mx-auto">
            <Link
              href="/dashboard/employer"
              className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center gap-1.5 transition-transform duration-200 hover:-translate-x-0.5"
            >
              <Icon name="chevronRight" className="w-3.5 h-3.5 rotate-180" />
              Back to dashboard
            </Link>
            <div className="flex items-center gap-3 mt-3">
              <motion.div
                initial={{ scale: 0.7, opacity: 0, rotate: -8 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.15 }}
                className="icon-tile bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md"
              >
                <Icon name="briefcase" className="w-5 h-5" />
              </motion.div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Company{' '}
                <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">
                  Profile
                </span>
              </h1>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          className="max-w-3xl mx-auto p-6 lg:p-10 relative z-10"
          variants={stagger(0.1, 0.1)}
          initial="hidden"
          animate="show"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.section
              variants={rise}
              className="relative overflow-hidden surface p-6 border border-white/60 shadow-lg shadow-slate-200/50"
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-400"
              />
              <h2 className="section-title mb-5">Company details</h2>
              <div className="grid gap-5 md:grid-cols-2">
                {COMPANY_FIELDS.map(renderField)}
                {renderField(DESCRIPTION_FIELD)}
              </div>
            </motion.section>

            <motion.section
              variants={rise}
              className="relative overflow-hidden surface p-6 border border-white/60 shadow-lg shadow-slate-200/50"
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400"
              />
              <h2 className="section-title mb-5">
                Services and repair specializations
              </h2>
              <motion.div
                className="grid gap-2.5 grid-cols-2 md:grid-cols-3"
                variants={stagger(0.03, 0.15)}
                initial="hidden"
                animate="show"
              >
                {SPECIALIZATIONS.map((name) => {
                  const active = specs.includes(name);
                  return (
                    <motion.button
                      type="button"
                      key={name}
                      variants={chipIn}
                      onClick={() => toggleSpec(name)}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                      className={`text-sm font-medium rounded-lg px-3 py-2.5 text-left border transition-colors duration-200 ${
                        active
                          ? 'bg-gradient-to-r from-blue-50 to-violet-50 border-blue-300 text-blue-700 shadow-sm shadow-blue-200/50'
                          : 'bg-white/70 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 transition-colors duration-200 ${
                            active
                              ? 'bg-gradient-to-br from-blue-500 to-violet-600 text-white'
                              : 'border border-slate-300 text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                        {name}
                      </span>
                    </motion.button>
                  );
                })}
              </motion.div>
            </motion.section>

            <motion.section
              variants={rise}
              className="relative overflow-hidden surface p-6 border border-white/60 shadow-lg shadow-slate-200/50"
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500"
              />
              <h2 className="section-title mb-5">Authorized person details</h2>
              <div className="grid gap-5 md:grid-cols-2">
                {PERSON_FIELDS.map(renderField)}
              </div>
            </motion.section>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="badge badge-danger w-full !justify-start !py-2.5 !px-4"
              >
                {error}
              </motion.div>
            )}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="badge badge-success w-full !justify-start !py-2.5 !px-4"
              >
                {message}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={saving}
              whileHover={saving ? undefined : { y: -1 }}
              whileTap={saving ? undefined : { scale: 0.99 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              className="relative w-full overflow-hidden rounded-xl py-3.5 text-base font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-600 to-violet-600 shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 disabled:opacity-60 transition-shadow inline-flex items-center justify-center gap-2"
            >
              {saving && (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              )}
              {saving ? 'Saving...' : 'Save profile'}
            </motion.button>
          </form>
        </motion.div>
      </main>
    </MotionConfig>
  );
}