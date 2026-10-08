'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import AuthImage from '../../components/AuthImage';
import Icon from '../../components/Icon';
import { CountUp, EASE, rise, stagger } from '../../components/motion';
import { EMPLOYMENT_OPTIONS } from '../../lib/employeeOptions';

const API = 'http://localhost:3000';
const MAX_PHOTO = 2 * 1024 * 1024;

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15';
const disabledClass = `${inputClass} !bg-slate-100 !text-slate-500`;
const cardClass = 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-600';

type FormState = {
  fullName: string;
  professionalTitle: string;
  currentCity: string;
  currentState: string;
  expYears: string;
  expMonths: string;
  employmentStatus: string;
  expectedSalary: string;
  preferredLocation: string;
  noticePeriodDays: string;
  immediateJoining: boolean;
};

const EMPTY: FormState = {
  fullName: '',
  professionalTitle: '',
  currentCity: '',
  currentState: '',
  expYears: '',
  expMonths: '',
  employmentStatus: '',
  expectedSalary: '',
  preferredLocation: '',
  noticePeriodDays: '',
  immediateJoining: false,
};

const nullIfEmpty = (v: string) => (v.trim() === '' ? null : v.trim());
const numberOrNull = (v: string) => (v.trim() === '' ? null : Number(v));

/* ---------- small animated pieces ---------- */

function Notice({ text, kind, className = '' }: { text: string; kind: 'ok' | 'err'; className?: string }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.p
          key={text}
          role={kind === 'err' ? 'alert' : 'status'}
          className={`rounded-lg px-4 py-2.5 text-sm ${
            kind === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          } ${className}`}
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

function Toggle({
  checked,
  onChange,
  title,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-4 rounded-xl p-3 text-left transition-colors hover:bg-slate-50"
    >
      <span
        className={`mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 ${
          checked ? 'justify-end bg-blue-600' : 'justify-start bg-slate-300'
        }`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="h-5 w-5 rounded-full bg-white shadow"
        />
      </span>
      <span>
        <span className="block font-medium text-slate-900">{title}</span>
        {hint && <span className="block text-sm text-slate-500">{hint}</span>}
      </span>
    </button>
  );
}

function SectionTitle({ icon, children }: { icon: React.ComponentProps<typeof Icon>['name']; children: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <h2 className="text-lg font-bold text-slate-900">{children}</h2>
    </div>
  );
}

function Spinner() {
  return (
    <motion.span
      className="mr-2 inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white align-[-2px]"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    />
  );
}

const press = { whileHover: { scale: 1.03 }, whileTap: { scale: 0.96 } };

function Ring({ percent }: { percent: number }) {
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <motion.circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: percent / 100 }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.5 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-xl font-extrabold text-slate-900">
          <CountUp value={percent} suffix="%" />
        </span>
        <span className="mt-1 text-[10px] font-medium text-slate-400">complete</span>
      </div>
    </div>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export default function EmployeeProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [contact, setContact] = useState({ email: '', mobile: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  const [hasPhoto, setHasPhoto] = useState(false);
  const [photoKey, setPhotoKey] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoMsg, setPhotoMsg] = useState('');
  const [photoErr, setPhotoErr] = useState('');

  const [visible, setVisible] = useState(true);
  const [shareContact, setShareContact] = useState(false);
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const [privacyMsg, setPrivacyMsg] = useState('');
  const [privacyErr, setPrivacyErr] = useState('');

  function setValue(key: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const token = () => localStorage.getItem('skilho_token') ?? '';

  useEffect(() => {
    const t = localStorage.getItem('skilho_token');
    if (!t) {
      router.replace('/login/employee');
      return;
    }
    let cancelled = false;

    fetch(`${API}/employee/profile`, {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('skilho_token');
          router.replace('/login/employee');
          throw new Error('Unauthorized');
        }
        if (!res.ok) {
          throw new Error(
            `Could not load your profile (error ${res.status}). Check the backend window.`,
          );
        }
        return res.json();
      })
      .then((p) => {
        if (cancelled) return;
        const months: number | null = p.totalExperienceMonths;
        setForm({
          fullName: p.fullName ?? '',
          professionalTitle: p.professionalTitle ?? '',
          currentCity: p.currentCity ?? '',
          currentState: p.currentState ?? '',
          expYears: months != null ? String(Math.floor(months / 12)) : '',
          expMonths: months != null ? String(months % 12) : '',
          employmentStatus: p.employmentStatus ?? '',
          expectedSalary: p.expectedSalary != null ? String(p.expectedSalary) : '',
          preferredLocation: p.preferredLocation ?? '',
          noticePeriodDays:
            p.noticePeriodDays != null ? String(p.noticePeriodDays) : '',
          immediateJoining: !!p.immediateJoining,
        });
        setContact({ email: p.email ?? '', mobile: p.mobile ?? '' });
        setHasPhoto(!!p.hasPhoto);
        setVisible(p.visibleToEmployers !== false);
        setShareContact(!!p.shareContactDetails);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled || err.message === 'Unauthorized') return;
        setLoadError(
          err instanceof TypeError
            ? 'Cannot reach the backend. Is it running on port 3000?'
            : err.message,
        );
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    const years = form.expYears.trim();
    const months = form.expMonths.trim();
    if (months !== '' && Number(months) > 11) {
      setError('Experience months must be between 0 and 11');
      return;
    }
    let totalMonths: number | null = null;
    if (years !== '' || months !== '') {
      totalMonths = Number(years || 0) * 12 + Number(months || 0);
    }

    const payload = {
      fullName: nullIfEmpty(form.fullName),
      professionalTitle: nullIfEmpty(form.professionalTitle),
      currentCity: nullIfEmpty(form.currentCity),
      currentState: nullIfEmpty(form.currentState),
      totalExperienceMonths: totalMonths,
      employmentStatus: form.employmentStatus === '' ? null : form.employmentStatus,
      expectedSalary: numberOrNull(form.expectedSalary),
      preferredLocation: nullIfEmpty(form.preferredLocation),
      noticePeriodDays: numberOrNull(form.noticePeriodDays),
      immediateJoining: form.immediateJoining,
    };

    setSaving(true);
    try {
      const res = await fetch(`${API}/employee/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
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

  async function uploadPhoto() {
    setPhotoErr('');
    setPhotoMsg('');

    if (!photoFile) {
      setPhotoErr('Choose a photo first');
      return;
    }
    if (photoFile.size > MAX_PHOTO) {
      setPhotoErr('Photo is too large (maximum 2 MB)');
      return;
    }

    setPhotoBusy(true);
    try {
      const body = new FormData();
      body.append('file', photoFile);

      const res = await fetch(`${API}/employee/photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;
        throw new Error(msg || 'Upload failed');
      }

      setHasPhoto(true);
      setPhotoKey((k) => k + 1);
      setPhotoFile(null);
      setPhotoInputKey((k) => k + 1);
      setPhotoMsg('Photo saved.');
    } catch (err) {
      setPhotoErr(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removePhoto() {
    if (!window.confirm('Remove your profile photo?')) return;
    setPhotoErr('');
    setPhotoMsg('');
    setPhotoBusy(true);
    try {
      const res = await fetch(`${API}/employee/photo`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not remove photo');

      setHasPhoto(false);
      setPhotoKey((k) => k + 1);
      setPhotoMsg('Photo removed.');
    } catch (err) {
      setPhotoErr(err instanceof Error ? err.message : 'Could not remove photo');
    } finally {
      setPhotoBusy(false);
    }
  }

  async function savePrivacy() {
    setPrivacyErr('');
    setPrivacyMsg('');
    setPrivacyBusy(true);
    try {
      const res = await fetch(`${API}/employee/privacy`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          visibleToEmployers: visible,
          shareContactDetails: shareContact,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;
        throw new Error(msg || 'Could not save privacy settings');
      }
      setPrivacyMsg('Privacy settings saved.');
    } catch (err) {
      setPrivacyErr(
        err instanceof Error ? err.message : 'Could not save privacy settings',
      );
    } finally {
      setPrivacyBusy(false);
    }
  }

  function textField(
    label: string,
    key: keyof FormState,
    opts: { number?: boolean; max?: number; placeholder?: string } = {},
  ) {
    return (
      <div>
        <label className={labelClass}>{label}</label>
        <input
          type={opts.number ? 'number' : 'text'}
          min={opts.number ? 0 : undefined}
          max={opts.max}
          placeholder={opts.placeholder}
          value={String(form[key])}
          onChange={(e) => setValue(key, e.target.value)}
          className={inputClass}
        />
      </div>
    );
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

  const initial = (form.fullName.trim()[0] ?? 'T').toUpperCase();
  const displayName = form.fullName.trim() || 'Your name';
  const statusLabel = EMPLOYMENT_OPTIONS.find((o) => o.value === form.employmentStatus)?.label;
  const location = [form.currentCity.trim(), form.currentState.trim()].filter(Boolean).join(', ');

  let expText = '';
  if (form.expYears.trim() !== '' || form.expMonths.trim() !== '') {
    const y = Number(form.expYears || 0);
    const m = Number(form.expMonths || 0);
    const parts: string[] = [];
    if (y) parts.push(`${y} yr${y > 1 ? 's' : ''}`);
    if (m) parts.push(`${m} mo`);
    expText = parts.length ? `${parts.join(' ')} experience` : 'Fresher';
  }

  const checks: [string, boolean][] = [
    ['Profile photo', hasPhoto],
    ['Full name', !!form.fullName.trim()],
    ['Professional title', !!form.professionalTitle.trim()],
    ['Current location', !!(form.currentCity.trim() && form.currentState.trim())],
    ['Total experience', form.expYears.trim() !== '' || form.expMonths.trim() !== ''],
    ['Employment status', !!form.employmentStatus],
    ['Expected salary', form.expectedSalary.trim() !== ''],
    ['Preferred location', !!form.preferredLocation.trim()],
  ];
  const percent = Math.round((checks.filter(([, ok]) => ok).length / checks.length) * 100);

  const chips: { key: string; text: string; tone: string; pin?: boolean }[] = [
    location && { key: 'loc', text: location, tone: 'bg-slate-100 text-slate-700', pin: true },
    expText && { key: 'exp', text: expText, tone: 'bg-blue-50 text-blue-700' },
    statusLabel && { key: 'status', text: statusLabel, tone: 'bg-violet-50 text-violet-700' },
    form.immediateJoining && { key: 'join', text: 'Available immediately', tone: 'bg-emerald-50 text-emerald-700' },
  ].filter(Boolean) as { key: string; text: string; tone: string; pin?: boolean }[];

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative min-h-screen overflow-x-clip bg-slate-50">
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
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">My Profile</h1>
            </div>
            <motion.div {...press}>
              <Link
                href="/employee/preview"
                className="block rounded-xl ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(12,16,19,.04),0_10px_28px_-14px_rgba(15,88,112,.14)] bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Preview profile
              </Link>
            </motion.div>
          </div>
        </motion.header>

        <motion.div
          className="relative mx-auto max-w-6xl space-y-6 p-6"
          variants={stagger(0.1, 0.1)}
          initial="hidden"
          animate="show"
        >
          {/* ===== Profile hero ===== */}
          <motion.section variants={rise} className="overflow-hidden rounded-2xl ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(12,16,19,.04),0_10px_28px_-14px_rgba(15,88,112,.14)] bg-white shadow-sm">
            {/* Compact accent banner */}
            <div className="relative h-20 sm:h-24 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-blue-600">
              <motion.div
                aria-hidden
                className="absolute -left-10 -top-20 h-64 w-64 rounded-full bg-cyan-400/30 blur-3xl"
                animate={{ x: [0, 80, 0], y: [0, 20, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                aria-hidden
                className="absolute -bottom-24 right-10 h-64 w-64 rounded-full bg-violet-500/40 blur-3xl"
                animate={{ x: [0, -70, 0], y: [0, -20, 0] }}
                transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.span
                aria-hidden
                className="absolute inset-y-0 w-1/5 -skew-x-12 bg-white/10"
                animate={{ x: ['-150%', '600%'] }}
                transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut', delay: 1.4 }}
              />
            </div>

            <div className="px-5 pb-5 sm:px-6">
              {/* Header row with Avatar + Info on Left, Completeness Ring on Right */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 -mt-10 sm:-mt-12">
                <div className="flex items-center sm:items-start gap-4">
                  <motion.div
                    className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 shadow-lg shadow-blue-900/20 ring-4 ring-white"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.2 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    {hasPhoto ? (
                      <AuthImage
                        url={`${API}/employee/photo`}
                        tokenKey="skilho_token"
                        alt="Your profile photo"
                        refreshKey={photoKey}
                        className="h-full w-full object-cover"
                        fallback={<span className="text-3xl font-bold text-slate-400">{initial}</span>}
                      />
                    ) : (
                      <span className="text-3xl font-bold text-slate-400">{initial}</span>
                    )}
                  </motion.div>
                  <div className="pt-8 sm:pt-10">
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">{displayName}</h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                      {form.professionalTitle.trim() || 'Add your professional title'}
                    </p>
                  </div>
                </div>

                {/* Profile Completeness Ring */}
                <div className="flex items-center gap-3 sm:gap-4 self-end sm:self-center pt-2 sm:pt-0">
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-semibold text-slate-900">Profile completeness</p>
                    <p className="text-[11px] text-slate-400">Based on the details on this page</p>
                  </div>
                  <Ring percent={percent} />
                </div>
              </div>

              {/* Chips row */}
              <motion.div layout className="mt-4 flex flex-wrap gap-2">
                <AnimatePresence>
                  {chips.map((c) => (
                    <motion.span
                      key={c.key}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${c.tone}`}
                    >
                      {c.pin && <PinIcon />}
                      {c.text}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Compact Photo controls */}
              <div className="mt-4 rounded-xl bg-slate-50 p-3 sm:p-3.5 border border-slate-100">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    key={photoInputKey}
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                    className="text-xs sm:text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <motion.button
                    type="button"
                    onClick={uploadPhoto}
                    disabled={photoBusy}
                    className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                    {...press}
                  >
                    {photoBusy && <Spinner />}
                    {photoBusy ? 'Please wait...' : hasPhoto ? 'Replace photo' : 'Upload photo'}
                  </motion.button>
                  <AnimatePresence>
                    {hasPhoto && (
                      <motion.button
                        type="button"
                        onClick={removePhoto}
                        disabled={photoBusy}
                        className="rounded-xl border border-rose-200 bg-white px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        {...press}
                      >
                        Remove photo
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  JPG or PNG, maximum 2 MB. Use a clear face photo.
                </p>
                <Notice text={photoErr} kind="err" className="mt-2" />
                <Notice text={photoMsg} kind="ok" className="mt-2" />
              </div>
            </div>
          </motion.section>

          {/* ===== Two-column body ===== */}
          <div className="grid items-start gap-6 lg:grid-cols-3">
            <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-2">
              <motion.section variants={rise} className={`${cardClass} space-y-4`}>
                <SectionTitle icon="user">Personal details</SectionTitle>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="text" value={contact.email || '-'} disabled className={disabledClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Mobile number</label>
                    <input type="text" value={contact.mobile || '-'} disabled className={disabledClass} />
                  </div>
                  <div className="md:col-span-2">{textField('Full name', 'fullName')}</div>
                  {textField('Current city', 'currentCity')}
                  {textField('Current state', 'currentState')}
                </div>
                <p className="text-xs text-slate-400">Email and mobile cannot be changed here yet.</p>
              </motion.section>

              <motion.section variants={rise} className={`${cardClass} space-y-4`}>
                <SectionTitle icon="briefcase">Professional details</SectionTitle>
                {textField('Professional title', 'professionalTitle', {
                  placeholder: 'e.g. iPhone Motherboard Technician',
                })}

                <div>
                  <label className={labelClass}>Total experience</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      min={0}
                      max={60}
                      placeholder="Years"
                      value={form.expYears}
                      onChange={(e) => setValue('expYears', e.target.value)}
                      className={inputClass}
                    />
                    <input
                      type="number"
                      min={0}
                      max={11}
                      placeholder="Months (0-11)"
                      value={form.expMonths}
                      onChange={(e) => setValue('expMonths', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Current employment status</label>
                    <select
                      value={form.employmentStatus}
                      onChange={(e) => setValue('employmentStatus', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select</option>
                      {EMPLOYMENT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {textField('Expected salary per month (Rs.)', 'expectedSalary', { number: true })}
                  {textField('Preferred location', 'preferredLocation', {
                    placeholder: 'e.g. Bengaluru, Mysuru',
                  })}
                  {textField('Notice period (days)', 'noticePeriodDays', { number: true, max: 180 })}
                </div>

                <Toggle
                  checked={form.immediateJoining}
                  onChange={(v) => setValue('immediateJoining', v)}
                  title="I am available to join immediately"
                />
              </motion.section>

              <Notice text={error} kind="err" />
              <Notice text={message} kind="ok" />

              <motion.button
                variants={rise}
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-blue-600 p-3.5 font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-700 disabled:opacity-60"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {saving && <Spinner />}
                {saving ? 'Saving...' : 'Save profile'}
              </motion.button>
            </form>

            <aside className="space-y-6 lg:sticky lg:top-28">
              <motion.section variants={rise} className={cardClass}>
                <SectionTitle icon="chart">Profile checklist</SectionTitle>
                <ul className="space-y-2.5">
                  {checks.map(([name, ok]) => (
                    <li key={name} className="flex items-center gap-3 text-sm">
                      <motion.span
                        animate={{ scale: ok ? [1, 1.35, 1] : 1 }}
                        transition={{ duration: 0.4 }}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          ok ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-transparent'
                        }`}
                      >
                        ✓
                      </motion.span>
                      <span className={ok ? 'text-slate-400' : 'font-medium text-slate-700'}>{name}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-slate-400">Fill in the details, then press Save profile.</p>
              </motion.section>

              <motion.section variants={rise} className={`${cardClass} space-y-2`}>
                <SectionTitle icon="eye">Privacy settings</SectionTitle>
                <Toggle
                  checked={visible}
                  onChange={setVisible}
                  title="Let approved companies see my profile"
                  hint="Turn this off to hide your profile from every employer."
                />
                <Toggle
                  checked={shareContact}
                  onChange={setShareContact}
                  title="Show my email and mobile number to employers who can see my profile"
                  hint="Off by default. Your contact details stay private unless you turn this on."
                />

                <Notice text={privacyErr} kind="err" />
                <Notice text={privacyMsg} kind="ok" />

                <div className="flex flex-col gap-2 pt-2">
                  <motion.button
                    type="button"
                    onClick={savePrivacy}
                    disabled={privacyBusy}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-50"
                    {...press}
                  >
                    {privacyBusy && <Spinner />}
                    {privacyBusy ? 'Saving...' : 'Save privacy settings'}
                  </motion.button>
                  <motion.div {...press}>
                    <Link
                      href="/employee/preview"
                      className="block rounded-xl border border-slate-200 px-5 py-2.5 text-center text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Preview what employers see →
                    </Link>
                  </motion.div>
                </div>
              </motion.section>
            </aside>
          </div>
        </motion.div>
      </main>
    </MotionConfig>
  );
}