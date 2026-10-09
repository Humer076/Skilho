'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TechnicianProfileView, {
  TechProfile,
} from '../../components/TechnicianProfileView';

const API = 'http://localhost:3001';

type Preview = TechProfile & {
  listing: { visibleToEmployers: boolean; hasName: boolean };
};

const SKELETON_CSS = `
  @keyframes skilhoShimmer {
    0%   { background-position: -500px 0; }
    100% { background-position: 500px 0; }
  }
  .skilho-shimmer {
    background: linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%);
    background-size: 1000px 100%;
    animation: skilhoShimmer 1.4s linear infinite;
  }

  @keyframes skilhoProgress {
    0%   { transform: translateX(-110%); }
    100% { transform: translateX(320%); }
  }
  .skilho-progress {
    animation: skilhoProgress 1.25s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  @keyframes skilhoFadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .skilho-fade-up {
    animation: skilhoFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes skilhoSpin {
    to { transform: rotate(360deg); }
  }
  .skilho-spin {
    animation: skilhoSpin 0.75s linear infinite;
  }

  @keyframes skilhoBreathe {
    0%, 100% { opacity: 0.5; }
    50%      { opacity: 1; }
  }
  .skilho-breathe {
    animation: skilhoBreathe 1.7s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .skilho-shimmer,
    .skilho-progress,
    .skilho-fade-up,
    .skilho-spin,
    .skilho-breathe {
      animation: none !important;
    }
  }
`;

export default function ProfilePreviewPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Preview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('skilho_token');
    if (!token) {
      router.replace('/login/employee');
      return;
    }
    let cancelled = false;

    fetch(`${API}/employee/preview`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('skilho_token');
          router.replace('/login/employee');
          throw new Error('Unauthorized');
        }
        if (!res.ok) {
          throw new Error(
            `Could not load your preview (error ${res.status}). Check the backend window.`,
          );
        }
        return res.json();
      })
      .then((data: Preview) => {
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
  }, [router]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="max-w-md bg-white rounded-xl shadow p-6 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <style>{SKELETON_CSS}</style>

        <div className="max-w-3xl mx-auto space-y-6">
          {/* Slim indeterminate progress bar */}
          <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200">
            <div className="skilho-progress h-full w-1/3 rounded-full bg-blue-600" />
          </div>

          {/* Header skeleton */}
          <div className="skilho-fade-up rounded-xl bg-white shadow-sm p-6">
            <div className="flex items-start gap-5">
              <div className="skilho-shimmer h-20 w-20 shrink-0 rounded-full" />
              <div className="flex-1 space-y-3 pt-1">
                <div className="skilho-shimmer h-4 w-2/5 rounded-full" />
                <div className="skilho-shimmer h-3 w-1/4 rounded-full" />
                <div className="flex gap-2 pt-1">
                  <div className="skilho-shimmer h-6 w-20 rounded-full" />
                  <div className="skilho-shimmer h-6 w-16 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Banner skeleton */}
          <div
            className="skilho-fade-up rounded-xl bg-white shadow-sm p-4"
            style={{ animationDelay: '100ms' }}
          >
            <div className="space-y-3">
              <div className="skilho-shimmer h-3 w-3/4 rounded-full" />
              <div className="skilho-shimmer h-3 w-1/3 rounded-full" />
            </div>
          </div>

          {/* Body skeleton */}
          <div
            className="skilho-fade-up space-y-4 rounded-xl bg-white shadow-sm p-6"
            style={{ animationDelay: '180ms' }}
          >
            <div className="skilho-shimmer h-3 w-1/3 rounded-full" />
            <div className="skilho-shimmer h-3 w-full rounded-full" />
            <div className="skilho-shimmer h-3 w-11/12 rounded-full" />
            <div className="skilho-shimmer h-3 w-4/5 rounded-full" />

            <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
              <div className="skilho-shimmer h-16 rounded-xl" />
              <div className="skilho-shimmer h-16 rounded-xl" />
              <div className="skilho-shimmer h-16 rounded-xl" />
            </div>
          </div>

          {/* Loading indicator */}
          <div
            className="skilho-fade-up flex items-center justify-center gap-3 pt-1"
            style={{ animationDelay: '260ms' }}
          >
            <span className="skilho-spin h-5 w-5 rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="skilho-breathe text-sm font-medium text-gray-500">
              Loading your preview…
            </p>
          </div>
        </div>
      </main>
    );
  }

  const listed = profile.listing.visibleToEmployers && profile.listing.hasName;
  let bannerText = 'Approved companies can see this profile.';
  if (!profile.listing.hasName) {
    bannerText =
      'Employers cannot see your profile yet. Add your full name in your profile first.';
  } else if (!profile.listing.visibleToEmployers) {
    bannerText =
      'Your profile is hidden. No employer can see it. You can turn visibility back on in your profile settings.';
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <style>{SKELETON_CSS}</style>

      <div className="skilho-fade-up max-w-3xl mx-auto space-y-6">
        <div>
          <Link href="/dashboard/employee" className="text-blue-600 text-sm">
            ← Back to dashboard
          </Link>
          <h2 className="text-lg font-semibold text-gray-900 mt-2">
            This is how employers see your profile
          </h2>
        </div>

        <div
          className={`rounded-xl p-4 text-sm ${
            listed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          <p>{bannerText}</p>
          <p className="mt-1">
            <Link href="/employee/profile" className="underline">
              Change photo and privacy settings
            </Link>
          </p>
        </div>

        <TechnicianProfileView
          profile={profile}
          photoUrl={`${API}/employee/photo`}
          tokenKey="skilho_token"
        />
      </div>
    </main>
  );
}