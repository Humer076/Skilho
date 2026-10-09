'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CAREER_EMPLOYMENT_OPTIONS,
  STAGE_OPTIONS,
  labelOf,
} from '../../lib/employeeOptions';

const API = 'http://localhost:3001';

const inputClass =
  'w-full border border-gray-300 rounded-lg p-3 text-gray-900 bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 hover:border-gray-400';

const SKILHO_CAREER_CSS = `
  @keyframes skilhoFadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .skilho-fade-up {
    animation: skilhoFadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes skilhoFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .skilho-fade-in {
    animation: skilhoFadeIn 0.45s ease-out both;
  }

  @keyframes skilhoFormOpen {
    from { opacity: 0; transform: translateY(-12px) scale(0.985); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .skilho-form-open {
    animation: skilhoFormOpen 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
    transform-origin: top center;
  }

  @keyframes skilhoTimelineIn {
    from { opacity: 0; transform: translateX(-14px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .skilho-timeline-in {
    animation: skilhoTimelineIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes skilhoShimmer {
    0%   { background-position: -600px 0; }
    100% { background-position: 600px 0; }
  }
  .skilho-shimmer {
    background: linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%);
    background-size: 1200px 100%;
    animation: skilhoShimmer 1.4s linear infinite;
  }

  @keyframes skilhoProgress {
    0%   { transform: translateX(-110%); }
    100% { transform: translateX(320%); }
  }
  .skilho-progress {
    animation: skilhoProgress 1.25s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  @keyframes skilhoSpin {
    to { transform: rotate(360deg); }
  }
  .skilho-spin {
    animation: skilhoSpin 0.75s linear infinite;
  }

  @keyframes skilhoBreathe {
    0%, 100% { opacity: 0.55; }
    50%      { opacity: 1; }
  }
  .skilho-breathe {
    animation: skilhoBreathe 1.7s ease-in-out infinite;
  }

  @keyframes skilhoPop {
    0%   { opacity: 0; transform: translateY(-6px) scale(0.96); }
    60%  { opacity: 1; transform: translateY(0) scale(1.02); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  .skilho-pop {
    animation: skilhoPop 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes skilhoPulseRing {
    0%   { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.45); }
    70%  { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
    100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
  }
  .skilho-pulse-green {
    animation: skilhoPulseRing 2.2s ease-out infinite;
  }

  .skilho-card {
    transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
                box-shadow 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .skilho-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px -12px rgba(15, 23, 42, 0.18),
                0 4px 10px -6px rgba(15, 23, 42, 0.1);
  }

  .skilho-btn {
    transition: transform 0.18s ease, background-color 0.2s ease,
                box-shadow 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  }
  .skilho-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px -10px rgba(37, 99, 235, 0.55);
  }
  .skilho-btn:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }

  .skilho-timeline-item {
    transition: transform 0.25s ease, background-color 0.25s ease;
  }
  .skilho-timeline-item:hover {
    transform: translateX(3px);
  }

  @media (prefers-reduced-motion: reduce) {
    .skilho-fade-up,
    .skilho-fade-in,
    .skilho-form-open,
    .skilho-timeline-in,
    .skilho-shimmer,
    .skilho-progress,
    .skilho-spin,
    .skilho-breathe,
    .skilho-pop,
    .skilho-pulse-green {
      animation: none !important;
    }
    .skilho-card,
    .skilho-btn,
    .skilho-timeline-item {
      transition: none !important;
    }
  }
`;

type Entry = {
  id: string;
  organization: string;
  position: string;
  stage: string;
  employmentType: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  skills: string[];
  responsibilities: string | null;
  certificateObtained: string | null;
  description: string | null;
};

type Edu = {
  id: string;
  institution: string;
  qualification: string;
  fieldOfStudy: string | null;
  startYear: number | null;
  endYear: number | null;
};

type Cert = {
  id: string;
  name: string;
  issuer: string | null;
  issuedYear: number | null;
};

type EntryForm = {
  organization: string;
  position: string;
  stage: string;
  employmentType: string;
  startMonth: string;
  endMonth: string;
  isCurrent: boolean;
  location: string;
  skills: string[];
  responsibilities: string;
  certificateObtained: string;
  description: string;
};

const EMPTY_ENTRY: EntryForm = {
  organization: '',
  position: '',
  stage: 'JUNIOR_TECHNICIAN',
  employmentType: 'FULL_TIME',
  startMonth: '',
  endMonth: '',
  isCurrent: false,
  location: '',
  skills: [],
  responsibilities: '',
  certificateObtained: '',
  description: '',
};

const EMPTY_EDU = {
  institution: '',
  qualification: '',
  fieldOfStudy: '',
  startYear: '',
  endYear: '',
};

const EMPTY_CERT = { name: '', issuer: '', issuedYear: '' };

const nullIfEmpty = (v: string) => (v.trim() === '' ? null : v.trim());
const numberOrNull = (v: string) => (v.trim() === '' ? null : Number(v));

function monthLabel(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function durationText(startIso: string, endIso: string | null) {
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : new Date();
  const months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth());
  if (months < 1) return 'less than a month';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
  if (rest > 0) parts.push(`${rest} mo${rest > 1 ? 's' : ''}`);
  return parts.join(' ');
}

export default function CareerPage() {
  const router = useRouter();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [education, setEducation] = useState<Edu[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [catalog, setCatalog] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EntryForm>(EMPTY_ENTRY);
  const [edu, setEdu] = useState(EMPTY_EDU);
  const [cert, setCert] = useState(EMPTY_CERT);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const token = localStorage.getItem('skilho_token');
    if (!token) {
      router.replace('/login/employee');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [cRes, sRes] = await Promise.all([
        fetch(`${API}/employee/career`, { headers }),
        fetch(`${API}/employee/skills`, { headers }),
      ]);

      if ([cRes.status, sRes.status].some((s) => s === 401 || s === 403)) {
        localStorage.removeItem('skilho_token');
        router.replace('/login/employee');
        return;
      }
      if (!cRes.ok || !sRes.ok) {
        const code = !cRes.ok ? cRes.status : sRes.status;
        throw new Error(
          `Could not load your career journey (error ${code}). Check the backend window.`,
        );
      }

      const career = await cRes.json();
      const skills = await sRes.json();
      setEntries(career.entries);
      setEducation(career.education);
      setCerts(career.certificates);
      setCatalog(skills.catalog.map((s: { name: string }) => s.name));
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

  async function call(path: string, method: string, body?: unknown) {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('skilho_token') ?? ''}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));

    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('skilho_token');
      router.replace('/login/employee');
      throw new Error('Please log in again');
    }
    if (!res.ok) {
      const msg = Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message;
      throw new Error(msg || 'Something went wrong');
    }
    return data;
  }

  async function run(action: () => Promise<void>, okText: string) {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      await action();
      await load();
      setMessage(okText);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  function setValue(key: keyof EntryForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSkill(name: string) {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(name)
        ? prev.skills.filter((s) => s !== name)
        : [...prev.skills, name],
    }));
  }

  function openNew() {
    setError('');
    setMessage('');
    setEditingId(null);
    setForm(EMPTY_ENTRY);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_ENTRY);
  }

  function startEdit(entry: Entry) {
    setError('');
    setMessage('');
    setEditingId(entry.id);
    setForm({
      organization: entry.organization,
      position: entry.position,
      stage: entry.stage,
      employmentType: entry.employmentType,
      startMonth: entry.startDate.slice(0, 7),
      endMonth: entry.endDate ? entry.endDate.slice(0, 7) : '',
      isCurrent: !entry.endDate,
      location: entry.location ?? '',
      skills: entry.skills,
      responsibilities: entry.responsibilities ?? '',
      certificateObtained: entry.certificateObtained ?? '',
      description: entry.description ?? '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function saveEntry(e: React.FormEvent) {
    e.preventDefault();

    if (!form.startMonth) {
      setError('Please choose the start month');
      return;
    }
    if (!form.isCurrent && !form.endMonth) {
      setError('Choose the end month, or tick "This is my current position"');
      return;
    }

    const payload = {
      organization: form.organization.trim(),
      position: form.position.trim(),
      stage: form.stage,
      employmentType: form.employmentType,
      startDate: `${form.startMonth}-01`,
      endDate: form.isCurrent ? null : `${form.endMonth}-01`,
      location: nullIfEmpty(form.location),
      skills: form.skills,
      responsibilities: nullIfEmpty(form.responsibilities),
      certificateObtained: nullIfEmpty(form.certificateObtained),
      description: nullIfEmpty(form.description),
    };

    const editing = editingId;
    run(
      async () => {
        if (editing) {
          await call(`/employee/career/entries/${editing}`, 'PUT', payload);
        } else {
          await call('/employee/career/entries', 'POST', payload);
        }
        closeForm();
      },
      editing ? 'Entry updated.' : 'Entry added.',
    );
  }

  function removeEntry(entry: Entry) {
    if (!window.confirm(`Delete "${entry.position}" at ${entry.organization}?`)) {
      return;
    }
    run(async () => {
      await call(`/employee/career/entries/${entry.id}`, 'DELETE');
    }, 'Entry deleted.');
  }

  function addEducation(e: React.FormEvent) {
    e.preventDefault();
    run(async () => {
      await call('/employee/career/education', 'POST', {
        institution: edu.institution.trim(),
        qualification: edu.qualification.trim(),
        fieldOfStudy: nullIfEmpty(edu.fieldOfStudy),
        startYear: numberOrNull(edu.startYear),
        endYear: numberOrNull(edu.endYear),
      });
      setEdu(EMPTY_EDU);
    }, 'Education added.');
  }

  function removeEducation(row: Edu) {
    if (!window.confirm(`Delete "${row.qualification}"?`)) return;
    run(async () => {
      await call(`/employee/career/education/${row.id}`, 'DELETE');
    }, 'Education deleted.');
  }

  function addCertificate(e: React.FormEvent) {
    e.preventDefault();
    run(async () => {
      await call('/employee/career/certificates', 'POST', {
        name: cert.name.trim(),
        issuer: nullIfEmpty(cert.issuer),
        issuedYear: numberOrNull(cert.issuedYear),
      });
      setCert(EMPTY_CERT);
    }, 'Certificate added.');
  }

  function removeCertificate(row: Cert) {
    if (!window.confirm(`Delete "${row.name}"?`)) return;
    run(async () => {
      await call(`/employee/career/certificates/${row.id}`, 'DELETE');
    }, 'Certificate deleted.');
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <style>{SKILHO_CAREER_CSS}</style>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200">
            <div className="skilho-progress h-full w-1/3 rounded-full bg-blue-600" />
          </div>

          <div className="skilho-fade-up rounded-xl bg-white shadow-sm p-6">
            <div className="skilho-shimmer h-3 w-32 rounded-full mb-4" />
            <div className="skilho-shimmer h-7 w-2/3 rounded-full mb-3" />
            <div className="skilho-shimmer h-3 w-5/6 rounded-full" />
          </div>

          <div
            className="skilho-fade-up rounded-xl bg-white shadow-sm p-6 space-y-4"
            style={{ animationDelay: '100ms' }}
          >
            <div className="skilho-shimmer h-4 w-1/4 rounded-full" />
            <div className="skilho-shimmer h-20 w-full rounded-xl" />
            <div className="skilho-shimmer h-20 w-full rounded-xl" />
          </div>

          <div
            className="skilho-fade-up rounded-xl bg-white shadow-sm p-6 space-y-4"
            style={{ animationDelay: '180ms' }}
          >
            <div className="skilho-shimmer h-4 w-1/4 rounded-full" />
            <div className="skilho-shimmer h-12 w-full rounded-xl" />
          </div>

          <div
            className="skilho-fade-up flex items-center justify-center gap-3 pt-1"
            style={{ animationDelay: '260ms' }}
          >
            <span className="skilho-spin h-5 w-5 rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="skilho-breathe text-sm font-medium text-gray-500">
              Loading your career journey…
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <style>{SKILHO_CAREER_CSS}</style>
        <div className="skilho-fade-up max-w-md bg-white rounded-xl shadow p-6 text-center">
          <p className="text-red-600 mb-4">{loadError}</p>
          <button
            onClick={() => {
              setLoading(true);
              load();
            }}
            className="skilho-btn bg-blue-600 text-white rounded-lg px-5 py-2 font-semibold hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const journey = entries.map((e) =>
    e.endDate == null ? 'Current position' : labelOf(STAGE_OPTIONS, e.stage),
  );
  const sortedEdu = [...education].sort(
    (a, b) => (b.endYear ?? 9999) - (a.endYear ?? 9999),
  );
  const sortedCerts = [...certs].sort(
    (a, b) => (b.issuedYear ?? 0) - (a.issuedYear ?? 0),
  );

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <style>{SKILHO_CAREER_CSS}</style>

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="skilho-fade-up">
          <Link
            href="/dashboard/employee"
            className="text-blue-600 text-sm inline-block transition-transform duration-200 hover:-translate-x-0.5"
          >
            ← Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            My Career Journey
          </h1>
          <p className="text-gray-500">
            Show your path from student to your current position. Employers
            will see this on your profile.
          </p>
        </div>

        {error && (
          <p className="skilho-pop text-red-600 text-sm rounded-lg bg-red-50 border border-red-200 px-4 py-2">
            {error}
          </p>
        )}
        {message && (
          <p className="skilho-pop text-green-700 text-sm rounded-lg bg-green-50 border border-green-200 px-4 py-2">
            {message}
          </p>
        )}

        {showForm && (
          <form
            onSubmit={saveEntry}
            className="skilho-form-open skilho-card bg-white rounded-xl shadow p-6 space-y-4 border-2 border-blue-200"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? 'Edit entry' : 'Add a career entry'}
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Academy or organization name *
                </label>
                <input
                  required
                  value={form.organization}
                  onChange={(e) => setValue('organization', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Position / role *
                </label>
                <input
                  required
                  value={form.position}
                  onChange={(e) => setValue('position', e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Career stage
                </label>
                <select
                  value={form.stage}
                  onChange={(e) => setValue('stage', e.target.value)}
                  className={inputClass}
                >
                  {STAGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Employment type
                </label>
                <select
                  value={form.employmentType}
                  onChange={(e) => setValue('employmentType', e.target.value)}
                  className={inputClass}
                >
                  {CAREER_EMPLOYMENT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Start month *
                </label>
                <input
                  type="month"
                  value={form.startMonth}
                  onChange={(e) => setValue('startMonth', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  End month
                </label>
                <input
                  type="month"
                  disabled={form.isCurrent}
                  value={form.isCurrent ? '' : form.endMonth}
                  onChange={(e) => setValue('endMonth', e.target.value)}
                  className={`${inputClass} disabled:bg-gray-100`}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-gray-800">
              <input
                type="checkbox"
                checked={form.isCurrent}
                onChange={(e) => setValue('isCurrent', e.target.checked)}
              />
              This is my current position (no end date)
            </label>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Location</label>
              <input
                value={form.location}
                onChange={(e) => setValue('location', e.target.value)}
                placeholder="City, state"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Skills learned or used
              </label>
              <div className="grid gap-2 grid-cols-2 md:grid-cols-3">
                {catalog.map((name) => (
                  <label
                    key={name}
                    className="flex items-center gap-2 text-gray-800 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={form.skills.includes(name)}
                      onChange={() => toggleSkill(name)}
                    />
                    {name}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Responsibilities
              </label>
              <textarea
                rows={3}
                value={form.responsibilities}
                onChange={(e) => setValue('responsibilities', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Certificate obtained
              </label>
              <input
                value={form.certificateObtained}
                onChange={(e) => setValue('certificateObtained', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setValue('description', e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={busy}
                className="skilho-btn bg-blue-600 text-white rounded-lg px-6 py-3 font-semibold hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {busy && (
                  <span className="skilho-spin h-4 w-4 rounded-full border-2 border-white border-t-transparent" />
                )}
                {busy ? 'Saving...' : editingId ? 'Save changes' : 'Add entry'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="skilho-btn border border-gray-300 rounded-lg px-6 py-3 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <section
          className="skilho-card bg-white rounded-xl shadow p-6 skilho-fade-up"
          style={{ animationDelay: '60ms' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>
            {!showForm && (
              <button
                onClick={openNew}
                className="skilho-btn bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold hover:bg-blue-700"
              >
                + Add entry
              </button>
            )}
          </div>

          {entries.length === 0 ? (
            <p className="text-gray-500">
              No entries yet. Start with where you learned repairing, then add
              each job.
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-700 bg-gray-100 rounded-lg p-3 mb-5 skilho-fade-in">
                {journey.join(' → ')}
              </p>
              <ul className="space-y-5">
                {entries.map((entry, i) => {
                  const current = entry.endDate == null;
                  return (
                    <li
                      key={entry.id}
                      className={`skilho-timeline-in skilho-timeline-item border-l-4 pl-4 ${
                        current ? 'border-green-500' : 'border-gray-300'
                      }`}
                      style={{ animationDelay: `${Math.min(i * 60, 400)}ms` }}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-gray-100 text-gray-700 text-xs rounded-full px-3 py-1">
                          {labelOf(STAGE_OPTIONS, entry.stage)}
                        </span>
                        {current && (
                          <span className="skilho-pulse-green bg-green-100 text-green-800 text-xs font-semibold rounded-full px-3 py-1">
                            Current position
                          </span>
                        )}
                      </div>
                      <p className="text-gray-900 font-semibold mt-1">
                        {entry.position} at {entry.organization}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {monthLabel(entry.startDate)} -{' '}
                        {entry.endDate ? monthLabel(entry.endDate) : 'Present'} ·{' '}
                        {durationText(entry.startDate, entry.endDate)} ·{' '}
                        {labelOf(CAREER_EMPLOYMENT_OPTIONS, entry.employmentType)}
                        {entry.location ? ` · ${entry.location}` : ''}
                      </p>

                      {entry.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {entry.skills.map((s) => (
                            <span
                              key={s}
                              className="bg-blue-50 text-blue-700 text-xs rounded-full px-3 py-1 transition-transform duration-200 hover:scale-105"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      {entry.responsibilities && (
                        <p className="text-gray-700 text-sm mt-2 whitespace-pre-line">
                          <span className="font-medium">Responsibilities: </span>
                          {entry.responsibilities}
                        </p>
                      )}
                      {entry.certificateObtained && (
                        <p className="text-gray-700 text-sm mt-1">
                          <span className="font-medium">Certificate: </span>
                          {entry.certificateObtained}
                        </p>
                      )}
                      {entry.description && (
                        <p className="text-gray-700 text-sm mt-1 whitespace-pre-line">
                          {entry.description}
                        </p>
                      )}

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => startEdit(entry)}
                          disabled={busy}
                          className="skilho-btn border border-gray-300 rounded-lg px-3 py-1 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeEntry(entry)}
                          disabled={busy}
                          className="skilho-btn border border-red-300 rounded-lg px-3 py-1 text-red-600 hover:bg-red-50 disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        <section
          className="skilho-card bg-white rounded-xl shadow p-6 skilho-fade-up"
          style={{ animationDelay: '120ms' }}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Education</h2>

          {sortedEdu.length > 0 && (
            <ul className="divide-y divide-gray-200 mb-6">
              {sortedEdu.map((row, i) => (
                <li
                  key={row.id}
                  className="skilho-fade-in py-3 flex items-center justify-between gap-4"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div>
                    <p className="text-gray-900 font-medium">
                      {row.qualification}
                      {row.fieldOfStudy ? `, ${row.fieldOfStudy}` : ''}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {row.institution}
                      {row.startYear || row.endYear
                        ? ` · ${row.startYear ?? '?'} - ${row.endYear ?? 'Present'}`
                        : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => removeEducation(row)}
                    disabled={busy}
                    className="skilho-btn border border-red-300 rounded-lg px-3 py-1 text-red-600 hover:bg-red-50 disabled:opacity-40 shrink-0"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={addEducation} className="space-y-3">
            <p className="text-sm text-gray-600">Add education</p>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                required
                placeholder="Institution *"
                value={edu.institution}
                onChange={(e) => setEdu({ ...edu, institution: e.target.value })}
                className={inputClass}
              />
              <input
                required
                placeholder="Qualification * (e.g. ITI, Diploma, 10th)"
                value={edu.qualification}
                onChange={(e) =>
                  setEdu({ ...edu, qualification: e.target.value })
                }
                className={inputClass}
              />
              <input
                placeholder="Field of study (optional)"
                value={edu.fieldOfStudy}
                onChange={(e) =>
                  setEdu({ ...edu, fieldOfStudy: e.target.value })
                }
                className={inputClass}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Start year"
                  value={edu.startYear}
                  onChange={(e) => setEdu({ ...edu, startYear: e.target.value })}
                  className={inputClass}
                />
                <input
                  type="number"
                  placeholder="End year"
                  value={edu.endYear}
                  onChange={(e) => setEdu({ ...edu, endYear: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="skilho-btn border border-blue-600 text-blue-600 rounded-lg px-5 py-2 font-semibold hover:bg-blue-50 disabled:opacity-40 inline-flex items-center gap-2"
            >
              {busy && (
                <span className="skilho-spin h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent" />
              )}
              Add education
            </button>
          </form>
        </section>

        <section
          className="skilho-card bg-white rounded-xl shadow p-6 skilho-fade-up"
          style={{ animationDelay: '180ms' }}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Certificates
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            Uploading certificate copies comes in a later update.
          </p>

          {sortedCerts.length > 0 && (
            <ul className="divide-y divide-gray-200 mb-6">
              {sortedCerts.map((row, i) => (
                <li
                  key={row.id}
                  className="skilho-fade-in py-3 flex items-center justify-between gap-4"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div>
                    <p className="text-gray-900 font-medium">{row.name}</p>
                    <p className="text-gray-500 text-sm">
                      {[row.issuer, row.issuedYear].filter(Boolean).join(' · ') ||
                        '-'}
                    </p>
                  </div>
                  <button
                    onClick={() => removeCertificate(row)}
                    disabled={busy}
                    className="skilho-btn border border-red-300 rounded-lg px-3 py-1 text-red-600 hover:bg-red-50 disabled:opacity-40 shrink-0"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={addCertificate} className="space-y-3">
            <p className="text-sm text-gray-600">Add certificate</p>
            <div className="grid gap-3 md:grid-cols-3">
              <input
                required
                placeholder="Certificate name *"
                value={cert.name}
                onChange={(e) => setCert({ ...cert, name: e.target.value })}
                className={inputClass}
              />
              <input
                placeholder="Issued by (optional)"
                value={cert.issuer}
                onChange={(e) => setCert({ ...cert, issuer: e.target.value })}
                className={inputClass}
              />
              <input
                type="number"
                placeholder="Year"
                value={cert.issuedYear}
                onChange={(e) => setCert({ ...cert, issuedYear: e.target.value })}
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="skilho-btn border border-blue-600 text-blue-600 rounded-lg px-5 py-2 font-semibold hover:bg-blue-50 disabled:opacity-40 inline-flex items-center gap-2"
            >
              {busy && (
                <span className="skilho-spin h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent" />
              )}
              Add certificate
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}