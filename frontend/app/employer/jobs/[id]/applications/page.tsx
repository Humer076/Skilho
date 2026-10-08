'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AuthImage from '../../../../components/AuthImage';

const API = 'http://localhost:3000';

const STATUS_OPTIONS = [
  'UNDER_REVIEW',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'SELECTED',
  'REJECTED',
  'HIRED',
];

const STATUS_CLASS: Record<string, string> = {
  APPLIED: 'bg-gray-100 text-gray-700',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800',
  SHORTLISTED: 'bg-purple-100 text-purple-800',
  INTERVIEW_SCHEDULED: 'bg-amber-100 text-amber-800',
  SELECTED: 'bg-green-100 text-green-800',
  HIRED: 'bg-green-200 text-green-900',
  REJECTED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-gray-200 text-gray-600',
};

function label(status: string) {
  return status.replace(/_/g, ' ');
}

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

type App = {
  id: string;
  status: string;
  coverNote: string | null;
  createdAt: string;
  employeeProfile: {
    id: string;
    fullName: string | null;
    professionalTitle: string | null;
    currentCity: string | null;
    currentState: string | null;
    totalExperienceMonths: number | null;
    photoStoredName: string | null;
    verified: boolean;
  };
};

export default function JobApplicationsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = String(params.id);

  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const token = localStorage.getItem('skilho_token');
    if (!token) {
      router.replace('/login/employer');
      return;
    }
    try {
      const res = await fetch(
        `${API}/employer/jobs/${jobId}/applications`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('skilho_token');
        router.replace('/login/employer');
        return;
      }
      if (!res.ok) {
        throw new Error(`Could not load applications (error ${res.status})`);
      }
      setApps(await res.json());
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
  }, [jobId, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(app: App, status: string) {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const res = await fetch(
        `${API}/employer/applications/${app.id}/status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('skilho_token')}`,
          },
          body: JSON.stringify({ status }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;
        throw new Error(msg || 'Could not update status');
      }
      setMessage(`Status updated to ${label(status)}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading...</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="max-w-md bg-white rounded-xl shadow p-6 text-center">
          <p className="text-red-600">{loadError}</p>
        </div>
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
          Applications ({apps.length})
        </h1>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        {message && <p className="text-green-600 text-sm mb-4">{message}</p>}

        {apps.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 text-gray-500">
            No applications yet for this job.
          </div>
        ) : (
          <ul className="space-y-4">
            {apps.map((app) => {
              const tech = app.employeeProfile;
              const initial = (tech.fullName?.trim()[0] ?? 'T').toUpperCase();
              const place = [tech.currentCity, tech.currentState]
                .filter(Boolean)
                .join(', ');
              const withdrawn = app.status === 'WITHDRAWN';

              return (
                <li key={app.id} className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 shrink-0 flex items-center justify-center">
                      {tech.photoStoredName ? (
                        <AuthImage
                          url={`${API}/employer/technicians/${tech.id}/photo`}
                          tokenKey="skilho_token"
                          alt={tech.fullName ?? 'Technician'}
                          className="w-14 h-14 object-cover"
                          fallback={
                            <span className="text-xl font-bold text-gray-500">
                              {initial}
                            </span>
                          }
                        />
                      ) : (
                        <span className="text-xl font-bold text-gray-500">
                          {initial}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link
                          href={`/employer/technicians/${tech.id}`}
                          className="font-semibold text-gray-900 hover:underline"
                        >
                          {tech.fullName || 'Unnamed technician'}
                        </Link>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold shrink-0 ${
                            STATUS_CLASS[app.status] ?? 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {label(app.status)}
                        </span>
                      </div>
                      {tech.professionalTitle && (
                        <p className="text-gray-600 text-sm">
                          {tech.professionalTitle}
                        </p>
                      )}
                      <p className="text-gray-500 text-sm">
                        {monthsText(tech.totalExperienceMonths)}
                        {place ? ` · ${place}` : ''}
                        {tech.verified ? ' · ✔ Verified' : ''}
                      </p>
                      {app.coverNote && (
                        <p className="text-gray-700 text-sm mt-2 whitespace-pre-line">
                          {app.coverNote}
                        </p>
                      )}
                      <p className="text-gray-400 text-xs mt-1">
                        Applied {new Date(app.createdAt).toLocaleDateString()}
                      </p>

                      {!withdrawn && (
                        <select
                          value={app.status}
                          disabled={busy}
                          onChange={(e) => changeStatus(app, e.target.value)}
                          className="mt-3 border border-gray-300 rounded-lg p-2 text-gray-900 bg-white disabled:opacity-40"
                        >
                          {app.status === 'APPLIED' && (
                            <option value="APPLIED">Applied</option>
                          )}
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {label(s)}
                            </option>
                          ))}
                        </select>
                      )}
                      {withdrawn && (
                        <p className="text-gray-500 text-sm mt-3 italic">
                          The candidate withdrew this application.
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}