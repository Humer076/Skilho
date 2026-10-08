'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import TechnicianProfileView, {
  TechProfile,
} from '../../../components/TechnicianProfileView';

const API = 'http://localhost:3000';

export default function EmployerTechnicianPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);

  const [profile, setProfile] = useState<TechProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('skilho_token');
    if (!token) {
      router.replace('/login/employer');
      return;
    }
    let cancelled = false;

    fetch(`${API}/employer/technicians/${id}`, {
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
            'Only approved companies can view technician profiles, and only employer accounts can open this page.',
          );
        }
        if (res.status === 404) {
          throw new Error(
            'This technician profile is not available. It may be hidden by the technician.',
          );
        }
        if (!res.ok) {
          throw new Error(`Could not load the profile (error ${res.status})`);
        }
        return res.json();
      })
      .then((data: TechProfile) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err) => {
        if (cancelled || err.message === 'Unauthorized') return;
        setError(
          err instanceof TypeError
            ? 'Cannot reach the backend. Is it running on port 3000?'
            : err.message,
        );
      });

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="max-w-md bg-white rounded-xl shadow p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/dashboard/employer" className="text-blue-600 font-semibold">
            ← Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/dashboard/employer" className="text-blue-600 text-sm">
          ← Back to dashboard
        </Link>

        <TechnicianProfileView
          profile={profile}
          photoUrl={`${API}/employer/technicians/${id}/photo`}
          tokenKey="skilho_token"
        />

        <section className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-900 font-semibold mb-1">Coming soon</p>
          <p className="text-gray-500">
            Save candidate, shortlist and invite to apply will appear here in a
            later update.
          </p>
        </section>
      </div>
    </main>
  );
}