'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  CATEGORY_OPTIONS,
  EXPERIENCE_OPTIONS,
  JOINING_OPTIONS,
  SPECIALIZATIONS,
  WORK_TYPE_OPTIONS,
} from '../../../lib/jobOptions';

const API = 'http://localhost:3001';

const inputClass =
  'w-full border border-gray-300 rounded-lg p-3 text-gray-900 bg-white';

type FormState = {
  title: string;
  description: string;
  category: string;
  vacancies: string;
  experience: string;
  salaryMin: string;
  salaryMax: string;
  salaryNegotiable: boolean;
  city: string;
  state: string;
  workType: string;
  joiningPreference: string;
  workingHours: string;
  weeklyHolidays: string;
  accommodationProvided: boolean;
  foodProvided: boolean;
  travelAllowance: boolean;
  overtimeAvailable: boolean;
  requiredCertificates: string;
  interviewProcess: string;
};

const EMPTY: FormState = {
  title: '',
  description: '',
  category: CATEGORY_OPTIONS[0],
  vacancies: '1',
  experience: 'FRESHER',
  salaryMin: '',
  salaryMax: '',
  salaryNegotiable: false,
  city: '',
  state: '',
  workType: 'FULL_TIME',
  joiningPreference: 'IMMEDIATE',
  workingHours: '',
  weeklyHolidays: '',
  accommodationProvided: false,
  foodProvided: false,
  travelAllowance: false,
  overtimeAvailable: false,
  requiredCertificates: '',
  interviewProcess: '',
};

const nullIfEmpty = (v: string) => (v.trim() === '' ? null : v.trim());

export default function JobFormPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);
  const isNew = id === 'new';

  const [form, setForm] = useState<FormState>(EMPTY);
  const [specs, setSpecs] = useState<string[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function setValue(key: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSpec(name: string) {
    setSpecs((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );
  }

  useEffect(() => {
    const token = localStorage.getItem('skilho_token');
    if (!token) {
      router.replace('/login/employer');
      return;
    }
    if (isNew) return;

    fetch(`${API}/employer/jobs/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('skilho_token');
          router.replace('/login/employer');
          throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error('Job not found');
        return res.json();
      })
      .then((job) => {
        setForm({
          title: job.title,
          description: job.description,
          category: job.category,
          vacancies: String(job.vacancies),
          experience: job.experience,
          salaryMin: job.salaryMin != null ? String(job.salaryMin) : '',
          salaryMax: job.salaryMax != null ? String(job.salaryMax) : '',
          salaryNegotiable: job.salaryNegotiable,
          city: job.city,
          state: job.state,
          workType: job.workType,
          joiningPreference: job.joiningPreference,
          workingHours: job.workingHours ?? '',
          weeklyHolidays: job.weeklyHolidays ?? '',
          accommodationProvided: job.accommodationProvided,
          foodProvided: job.foodProvided,
          travelAllowance: job.travelAllowance,
          overtimeAvailable: job.overtimeAvailable,
          requiredCertificates: job.requiredCertificates ?? '',
          interviewProcess: job.interviewProcess ?? '',
        });
        setSpecs(job.specializations ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (err.message !== 'Unauthorized') {
          setError(err.message);
          setLoading(false);
        }
      });
  }, [id, isNew, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (specs.length === 0) {
      setError('Choose at least one technician specialization');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      vacancies: Number(form.vacancies),
      specializations: specs,
      experience: form.experience,
      salaryMin: form.salaryMin.trim() === '' ? null : Number(form.salaryMin),
      salaryMax: form.salaryMax.trim() === '' ? null : Number(form.salaryMax),
      salaryNegotiable: form.salaryNegotiable,
      city: form.city.trim(),
      state: form.state.trim(),
      workType: form.workType,
      joiningPreference: form.joiningPreference,
      workingHours: nullIfEmpty(form.workingHours),
      weeklyHolidays: nullIfEmpty(form.weeklyHolidays),
      accommodationProvided: form.accommodationProvided,
      foodProvided: form.foodProvided,
      travelAllowance: form.travelAllowance,
      overtimeAvailable: form.overtimeAvailable,
      requiredCertificates: nullIfEmpty(form.requiredCertificates),
      interviewProcess: nullIfEmpty(form.interviewProcess),
    };

    setSaving(true);
    try {
      const res = await fetch(
        isNew ? `${API}/employer/jobs` : `${API}/employer/jobs/${id}`,
        {
          method: isNew ? 'POST' : 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('skilho_token')}`,
          },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;
        throw new Error(msg || 'Could not save job');
      }

      router.push('/employer/jobs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save job');
    } finally {
      setSaving(false);
    }
  }

  function selectField(
    label: string,
    key: keyof FormState,
    options: { value: string; label: string }[],
  ) {
    return (
      <div>
        <label className="block text-sm text-gray-600 mb-1">{label}</label>
        <select
          value={String(form[key])}
          onChange={(e) => setValue(key, e.target.value)}
          className={inputClass}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  function textField(
    label: string,
    key: keyof FormState,
    opts: { required?: boolean; number?: boolean; placeholder?: string } = {},
  ) {
    return (
      <div>
        <label className="block text-sm text-gray-600 mb-1">{label}</label>
        <input
          type={opts.number ? 'number' : 'text'}
          min={opts.number ? 0 : undefined}
          required={opts.required}
          placeholder={opts.placeholder}
          value={String(form[key])}
          onChange={(e) => setValue(key, e.target.value)}
          className={inputClass}
        />
      </div>
    );
  }

  function checkField(label: string, key: keyof FormState) {
    return (
      <label className="flex items-center gap-2 text-gray-800">
        <input
          type="checkbox"
          checked={Boolean(form[key])}
          onChange={(e) => setValue(key, e.target.checked)}
        />
        {label}
      </label>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className={error ? 'text-red-600' : 'text-gray-600'}>
          {error || 'Loading...'}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/employer/jobs" className="text-blue-600 text-sm">
          ← Back to my jobs
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">
          {isNew ? 'Post a Job' : 'Edit Job'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Job information
            </h2>
            {textField('Job title *', 'title', {
              required: true,
              placeholder: 'e.g. Senior iPhone Motherboard Technician',
            })}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Job description *
              </label>
              <textarea
                rows={5}
                required
                value={form.description}
                onChange={(e) => setValue('description', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {selectField(
                'Job category',
                'category',
                CATEGORY_OPTIONS.map((c) => ({ value: c, label: c })),
              )}
              {textField('Number of vacancies *', 'vacancies', {
                required: true,
                number: true,
              })}
              {selectField('Experience required', 'experience', EXPERIENCE_OPTIONS)}
              {selectField('Work type', 'workType', WORK_TYPE_OPTIONS)}
              {textField('City *', 'city', { required: true })}
              {textField('State *', 'state', { required: true })}
              {selectField('Joining preference', 'joiningPreference', JOINING_OPTIONS)}
            </div>
          </section>

          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Technician specialization *
            </h2>
            <div className="grid gap-2 grid-cols-2 md:grid-cols-3">
              {SPECIALIZATIONS.map((name) => (
                <label key={name} className="flex items-center gap-2 text-gray-800">
                  <input
                    type="checkbox"
                    checked={specs.includes(name)}
                    onChange={() => toggleSpec(name)}
                  />
                  {name}
                </label>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Salary (per month, in rupees)
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {textField('Minimum salary', 'salaryMin', { number: true })}
              {textField('Maximum salary', 'salaryMax', { number: true })}
            </div>
            {checkField('Salary is negotiable', 'salaryNegotiable')}
          </section>

          <section className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Work conditions and benefits
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {textField('Working hours', 'workingHours', {
                placeholder: 'e.g. 10 AM to 8 PM',
              })}
              {textField('Weekly holidays', 'weeklyHolidays', {
                placeholder: 'e.g. Sunday',
              })}
            </div>
            <div className="grid gap-2 grid-cols-2">
              {checkField('Accommodation provided', 'accommodationProvided')}
              {checkField('Food provided', 'foodProvided')}
              {checkField('Travel allowance', 'travelAllowance')}
              {checkField('Overtime available', 'overtimeAvailable')}
            </div>
          </section>

          <section className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Requirements and interview
            </h2>
            {textField('Required certificates', 'requiredCertificates')}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Interview process
              </label>
              <textarea
                rows={3}
                value={form.interviewProcess}
                onChange={(e) => setValue('interviewProcess', e.target.value)}
                className={inputClass}
              />
            </div>
          </section>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white rounded-lg p-3 font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : isNew ? 'Save job as draft' : 'Save changes'}
          </button>
          <p className="text-gray-500 text-sm text-center">
            You publish the job from the My Jobs page after saving.
          </p>
        </form>
      </div>
    </main>
  );
}