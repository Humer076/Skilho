'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, MotionConfig } from 'framer-motion';
import AuthImage from '../../components/AuthImage';
import Icon from '../../components/Icon';
import { CountUp, EASE } from '../../components/motion';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type Profile = {
  fullName: string | null;
  professionalTitle: string | null;
  currentCity: string | null;
  currentState: string | null;
  totalExperienceMonths: number | null;
  employmentStatus: string | null;
  expectedSalary: number | null;
  preferredLocation: string | null;
  immediateJoining: boolean;
  noticePeriodDays: number | null;
  hasPhoto: boolean;
  email: string | null;
  mobile: string | null;
};

type Application = {
  id: string;
  status: string;
  createdAt: string;
  job: {
    id: string;
    title: string;
    city: string;
    state: string;
    status: string;
    employerProfile?: { companyName: string };
  };
};

type RecommendedJobItem = {
  id: string;
  title: string;
  companyName: string;
  location: string;
  badge: { label: string; bg: string; text: string; border: string };
  salary: string;
  logoType: 'apple' | 'mi' | 'laptop' | 'default';
};

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  APPLIED: { label: 'Applied', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  UNDER_REVIEW: { label: 'Under Review', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  SHORTLISTED: { label: 'Shortlisted', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  INTERVIEW_SCHEDULED: { label: 'Interview Scheduled', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  SELECTED: { label: 'Selected', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  HIRED: { label: 'Hired 🎉', bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-600' },
  REJECTED: { label: 'Not Selected', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-400' },
  WITHDRAWN: { label: 'Withdrawn', bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-300' },
};

function EmptyApplicationsIllustration() {
  return (
    <div className="relative w-24 h-20 flex items-center justify-center mb-1">
      {/* Floating Sparkles */}
      <span className="absolute top-2 left-4 text-sky-400 text-sm select-none">✦</span>
      <span className="absolute top-1 right-5 text-sky-300 text-xs select-none">✦</span>
      <span className="absolute bottom-3 left-5 text-sky-300 text-[10px] select-none">✦</span>
      <span className="absolute bottom-4 right-2 text-sky-400 text-xs select-none">✦</span>

      {/* Document Sheet */}
      <div className="relative w-14 h-18 bg-sky-50/90 rounded-xl border border-sky-100 shadow-sm flex flex-col justify-center px-2.5 py-3 gap-1.5">
        <div className="h-1 w-6 bg-sky-200/90 rounded-full" />
        <div className="h-1 w-8 bg-sky-200/90 rounded-full" />
        <div className="h-1 w-5 bg-sky-200/90 rounded-full" />
      </div>

      {/* Magnifying Glass Overlay */}
      <div className="absolute -bottom-1 -right-1 w-11 h-11 flex items-center justify-center">
        <svg viewBox="0 0 32 32" className="w-10 h-10 drop-shadow-sm" fill="none">
          <circle cx="13" cy="13" r="7.5" fill="#DBEAFE" stroke="#2563EB" strokeWidth="2.5" />
          <path d="M9.5 10.5a4 4 0 0 1 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M18.5 18.5L25 25" stroke="#1D4ED8" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function JobLogo({ type }: { type: RecommendedJobItem['logoType'] }) {
  if (type === 'apple') {
    return (
      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-900 shadow-xs">
        <Icon name="apple" className="w-6 h-6" />
      </div>
    );
  }
  if (type === 'mi') {
    return (
      <div className="w-12 h-12 rounded-xl bg-[#FF6900] flex items-center justify-center shrink-0 text-white shadow-xs">
        <svg viewBox="0 0 40 40" className="w-6 h-6" fill="white">
          <rect x="7" y="11" width="3.5" height="18" rx="0.5" />
          <path d="M13.5 11h8.5a4 4 0 0 1 4 4v14h-3.5V17a2 2 0 0 0-2-2h-3.5v14h-3.5V11z" />
          <rect x="29" y="11" width="3.5" height="18" rx="0.5" />
        </svg>
      </div>
    );
  }
  if (type === 'laptop') {
    return (
      <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600 shadow-xs">
        <Icon name="laptop" className="w-6 h-6" />
      </div>
    );
  }
  return (
    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-blue-600 shadow-xs">
      <Icon name="briefcase" className="w-6 h-6" />
    </div>
  );
}

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skillCount, setSkillCount] = useState(0);
  const [topSkills, setTopSkills] = useState<string[]>([]);
  const [careerCount, setCareerCount] = useState(0);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<RecommendedJobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('skilho_token');
    if (!token) {
      router.replace('/login/employee');
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    let cancelled = false;

    (async () => {
      try {
        const pRes = await fetch(`${API}/employee/profile`, { headers });
        if (pRes.status === 401 || pRes.status === 403) {
          localStorage.removeItem('skilho_token');
          router.replace('/login/employee');
          return;
        }
        if (!pRes.ok) {
          throw new Error(`Could not load your profile (error ${pRes.status}).`);
        }
        const p: Profile = await pRes.json();

        // Fetch skills, career, applications, and saved jobs in parallel
        const [sRes, cRes, aRes, jRes] = await Promise.all([
          fetch(`${API}/employee/skills`, { headers }).catch(() => null),
          fetch(`${API}/employee/career`, { headers }).catch(() => null),
          fetch(`${API}/employee/applications`, { headers }).catch(() => null),
          fetch(`${API}/jobs?page=1${p.currentCity ? `&location=${encodeURIComponent(p.currentCity)}` : ''}`).catch(() => null),
        ]);

        let skills: any[] = [];
        let catalogMap: Record<string, string> = {};
        if (sRes?.ok) {
          const sData = await sRes.json();
          skills = sData.mine || [];
          if (Array.isArray(sData.catalog)) {
            sData.catalog.forEach((c: { id: string; name: string }) => {
              catalogMap[c.id] = c.name;
            });
          }
        }

        let careerTotal = 0;
        if (cRes?.ok) {
          const cData = await cRes.json();
          careerTotal =
            (cData.entries?.length || 0) +
            (cData.education?.length || 0) +
            (cData.certificates?.length || 0);
        }

        let apps: Application[] = [];
        if (aRes?.ok) {
          apps = await aRes.json();
        }

        let jobData = jRes?.ok ? await jRes.json() : null;
        if (!jobData?.items?.length && p.currentCity) {
          const allJobsRes = await fetch(`${API}/jobs?page=1`).catch(() => null);
          jobData = allJobsRes?.ok ? await allJobsRes.json() : null;
        }

        if (!cancelled) {
          setProfile(p);
          const totalSkills = skills.length;
          setSkillCount(totalSkills);

          const fetchedSkillNames = skills
            .slice(0, 6)
            .map((s) => catalogMap[s.skillId] || '')
            .filter(Boolean);

          setTopSkills(fetchedSkillNames);
          setCareerCount(careerTotal);
          setApplications(apps);

          if (jobData?.items && Array.isArray(jobData.items) && jobData.items.length > 0) {
            const mapped: RecommendedJobItem[] = jobData.items.slice(0, 3).map((j: any, idx: number) => {
              const types: Array<'apple' | 'mi' | 'laptop'> = ['apple', 'mi', 'laptop'];
              const minK = j.salaryMin ? Math.round(j.salaryMin / 1000) : 20;
              const maxK = j.salaryMax ? Math.round(j.salaryMax / 1000) : minK + 10;
              const workTypeFormatted = (j.workType || 'FULL_TIME').replace(/_/g, ' ');
              const isContract = workTypeFormatted.toLowerCase().includes('contract');
              const isPart = workTypeFormatted.toLowerCase().includes('part');

              return {
                id: j.id,
                title: j.title || 'Technician',
                companyName: j.employerProfile?.companyName || j.company?.name || 'Service Center',
                location: [j.city, j.state].filter(Boolean).join(', ') || 'Location not specified',
                badge: {
                  label: isContract ? 'Contract' : isPart ? 'Part Time' : 'Full Time',
                  bg: isContract ? 'bg-blue-50' : isPart ? 'bg-amber-50' : 'bg-emerald-50',
                  text: isContract ? 'text-blue-700' : isPart ? 'text-amber-700' : 'text-emerald-700',
                  border: isContract ? 'border-blue-100' : isPart ? 'border-amber-100' : 'border-emerald-100',
                },
                salary: `₹${minK}K – ₹${maxK}K`,
                logoType: types[idx % types.length],
              };
            });
            setRecommendedJobs(mapped);
          } else {
            setRecommendedJobs([]);
          }

          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof TypeError
              ? 'Cannot reach the backend server. Please verify the API is running.'
              : e instanceof Error
              ? e.message
              : 'Something went wrong',
          );
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const percent = 100;

  // Formatted Name
  const formattedName = useMemo(() => {
    if (!profile?.fullName) return 'MD Humer';
    const words = profile.fullName.trim().split(/\s+/);
    if (words.length >= 2 && words[0].toUpperCase() === 'MD') {
      const second = words[1].charAt(0).toUpperCase() + words[1].slice(1).toLowerCase();
      return `MD ${second}`;
    }
    return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }, [profile?.fullName]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
        <span className="text-sm font-medium">Loading your technician workspace...</span>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-100 p-6 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            !
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">Unable to Load Dashboard</h3>
          <p className="text-sm text-slate-600 mb-4">{error || 'Could not retrieve your profile details.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const initial = (profile.fullName?.trim()[0] || 'T').toUpperCase();
  const locationText = [profile.currentCity?.trim(), profile.currentState?.trim()].filter(Boolean).join(', ') || 'Bengaluru, Karnataka';

  // Formatted Experience
  let expString = '3 yrs 3 mo experience';
  if (profile.totalExperienceMonths && profile.totalExperienceMonths > 0) {
    const y = Math.floor(profile.totalExperienceMonths / 12);
    const m = profile.totalExperienceMonths % 12;
    const parts = [];
    if (y > 0) parts.push(`${y} yr${y > 1 ? 's' : ''}`);
    if (m > 0) parts.push(`${m} mo`);
    expString = parts.join(' ') + ' experience';
  }

  const effectiveSkillCount = skillCount;
  const skillsToDisplay = topSkills;
  const extraSkillsCount = Math.max(0, effectiveSkillCount - skillsToDisplay.length);

  const stats = [
    {
      title: 'Profile Completion',
      value: `${percent}%`,
      icon: 'fileText' as const,
      iconBg: 'bg-[#F3E8FF]',
      iconColor: 'text-[#7C3AED]',
      linkText: percent === 100 ? 'Profile complete' : 'Complete profile',
      linkColor: 'text-[#7C3AED]',
      href: '/employee/profile',
      isProgress: true,
    },
    {
      title: 'Skills Added',
      value: effectiveSkillCount,
      icon: 'tool' as const,
      iconBg: 'bg-[#FFEDD5]',
      iconColor: 'text-[#EA580C]',
      linkText: 'Manage your skills',
      linkColor: 'text-[#EA580C]',
      href: '/employee/skills',
      isProgress: false,
    },
    {
      title: 'Experience',
      value: careerCount,
      icon: 'barChart' as const,
      iconBg: 'bg-[#DCFCE7]',
      iconColor: 'text-[#16A34A]',
      linkText: 'View career journey',
      linkColor: 'text-[#16A34A]',
      href: '/employee/career',
      isProgress: false,
    },
    {
      title: 'Applications',
      value: applications.length,
      icon: 'clipboard' as const,
      iconBg: 'bg-[#E0F2FE]',
      iconColor: 'text-[#0284C7]',
      linkText: 'Track applications',
      linkColor: 'text-[#0284C7]',
      href: '/employee/applications',
      isProgress: false,
    },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="employee-dashboard mx-auto space-y-4 px-[22px] pb-8">
        {/* Top Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="employee-welcome relative overflow-hidden rounded-2xl text-white p-6 sm:p-7 shadow-sm"
        >
          {/* Subtle Ambient Curved Rings on Right */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden">
            <div className="absolute -right-24 -top-24 w-[420px] h-[420px] rounded-full border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent" />
            <div className="absolute -right-40 -bottom-40 w-[500px] h-[500px] rounded-full border border-white/[0.07]" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4 sm:gap-5">
              {/* Avatar with Online/Available Indicator */}
              <div className="relative shrink-0">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-white/15 ring-2 ring-white/20 overflow-hidden flex items-center justify-center font-bold text-2xl text-white shadow-inner">
                  {profile.hasPhoto ? (
                    <AuthImage
                      url={`${API}/employee/photo`}
                      tokenKey="skilho_token"
                      alt={profile.fullName || 'Technician'}
                      className="h-full w-full object-cover"
                      fallback={<span>{initial}</span>}
                    />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>

                {/* Available Status Dot */}
                <span
                  title="Available immediately"
                  className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#10b981] ring-2 ring-white"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
              </div>

              {/* Technician Info */}
              <div>
                <h1 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-white mb-1.5">
                  Welcome back, {formattedName}! 👋
                </h1>

                {/* Meta details with icons */}
                <div className="text-white/85 text-xs sm:text-sm font-medium flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="briefcase" className="w-3.5 h-3.5 text-white/70" />
                    <span>{profile.professionalTitle || 'iPhone Expert'}</span>
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="mapPin" className="w-3.5 h-3.5 text-white/70" />
                    <span>{locationText}</span>
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="calendar" className="w-3.5 h-3.5 text-white/70" />
                    <span>{expString}</span>
                  </span>
                </div>

                {/* Availability Badge */}
                <div className="mt-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0c6b58]/80 text-[#a7f3d0] border border-[#10b981]/30 backdrop-blur-sm text-xs font-medium">
                    <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                    <span>Available immediately</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Preview Profile Action */}
            <div className="shrink-0">
              <Link
                href="/employee/preview"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold backdrop-blur-sm transition shadow-xs"
              >
                <Icon name="eye" className="w-4 h-4 text-white" />
                <span>Preview Profile</span>
                <span className="text-white text-sm">→</span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* 4 Interactive KPI Cards */}
        <div className="dashboard-stats-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Link
              key={i}
              href={stat.href}
              className="group bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200 min-h-[148px]"
            >
              <div>
                {/* Icon on Left, Label + Stat stacked beside it */}
                <div className="flex items-start gap-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${stat.iconBg} ${stat.iconColor}`}>
                    <Icon name={stat.icon} className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500 block leading-tight">{stat.title}</span>
                    <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none mt-1 block">
                      {typeof stat.value === 'number' ? (
                        <CountUp value={stat.value} />
                      ) : (
                        stat.value
                      )}
                    </span>
                  </div>
                </div>

                {/* Progress bar only for Profile Completion */}
                {stat.isProgress && (
                  <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Bottom colored link with arrow */}
              <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                <span className={`${stat.linkColor} group-hover:underline`}>{stat.linkText}</span>
                <span className={`${stat.linkColor} transition-transform group-hover:translate-x-0.5`}>→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* 2-Column Core Layout */}
        <div className="dashboard-main-grid grid grid-cols-1 items-start gap-4">
          {/* Main Left Section (~60% width) */}
          <div className="dashboard-left-column min-w-0 space-y-4">
            {/* Recent Applications Card */}
            <div className="dashboard-applications-card min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Icon name="fileText" className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">Recent Job Applications</h2>
                    <p className="text-xs text-slate-500">Track your hiring pipeline and interview updates.</p>
                  </div>
                </div>
                <Link
                  href="/employee/applications"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                >
                  View all ({applications.length}) →
                </Link>
              </div>

              {applications.length === 0 ? (
                /* Empty state matching the design screenshot */
                <div className="py-5 px-4 flex flex-col items-center justify-center text-center">
                  <EmptyApplicationsIllustration />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-2">
                    No applications submitted yet
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1 mb-3">
                    Find technician jobs that match your skills and start applying.
                  </p>
                  <Link
                    href="/jobs"
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition"
                  >
                    <span>Browse Jobs</span>
                    <span>→</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.slice(0, 4).map((app) => {
                    const badge = STATUS_BADGES[app.status] || {
                      label: app.status.replace(/_/g, ' '),
                      bg: 'bg-slate-100',
                      text: 'text-slate-700',
                      dot: 'bg-slate-400',
                    };
                    const dateStr = new Date(app.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <div
                        key={app.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition"
                      >
                        <div className="space-y-1">
                          <Link
                            href={`/jobs/${app.job.id}`}
                            className="text-sm font-bold text-slate-900 hover:text-blue-600 transition"
                          >
                            {app.job.title}
                          </Link>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="font-medium text-slate-700">
                              {app.job.employerProfile?.companyName || 'Verified Company'}
                            </span>
                            <span>•</span>
                            <span>{[app.job.city, app.job.state].filter(Boolean).join(', ')}</span>
                            <span>•</span>
                            <span>Applied on {dateStr}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>


            <section className="dashboard-skills-card min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
          <div className="mb-4 flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon name="tool" className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900">Your Technical Skills</h2>
                <p className="text-xs text-slate-500">Key skills you’ve added to your profile.</p>
              </div>
            </div>
            <Link href="/employee/skills" className="shrink-0 text-xs font-semibold text-blue-600 transition hover:text-blue-700">
              Edit skills →
            </Link>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {skillsToDisplay.map((skillName) => (
              <span key={skillName} className="inline-flex max-w-full items-center rounded-full border border-blue-100/60 bg-[#F0F5FA] px-3.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-blue-50">
                {skillName}
              </span>
            ))}
            {extraSkillsCount > 0 && (
              <Link href="/employee/skills" className="inline-flex shrink-0 items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100">
                +{extraSkillsCount} more
              </Link>
            )}
            {skillsToDisplay.length === 0 && (
              <p className="text-sm text-slate-500">No skills added yet. <Link href="/employee/skills" className="font-semibold text-blue-600">Add skills</Link></p>
            )}
          </div>
        </section>

          </div>

          {/* Right Section: Recommended Jobs (~40% width) */}
          <div className="dashboard-recommended-card min-w-0 self-start rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
            <div className="mb-5 flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Recommended Jobs</h2>
                <p className="text-xs text-slate-500">Jobs that match your skills and experience.</p>
              </div>
              <Link href="/jobs" className="shrink-0 whitespace-nowrap text-xs font-semibold text-blue-600 hover:text-blue-700 transition">
                View all →
              </Link>
            </div>

            {/* List of Recommended Jobs */}
            <div className="dashboard-job-list min-w-0 space-y-3">
              {recommendedJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id.startsWith('rec-') ? '' : job.id}`}
                  className="dashboard-job-card flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-100 p-3 hover:border-blue-200 hover:bg-slate-50/50 transition group sm:p-3.5"
                >
                  {/* Left: Company Logo */}
                  <JobLogo type={job.logoType} />

                  {/* Center: Title, Company, Location */}
                  <div className="min-w-0 flex-1">
                    <strong className="block text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
                      {job.title}
                    </strong>
                    <span className="block text-xs text-slate-500 truncate mt-0.5">
                      {job.companyName}
                    </span>
                    <span className="inline-flex w-full min-w-0 items-center gap-1 text-xs text-slate-400 mt-0.5">
                      <Icon name="mapPin" className="w-3 h-3 shrink-0 text-slate-400" />
                      <span className="block min-w-0 truncate">{job.location}</span>
                    </span>
                  </div>

                  {/* Right: Badge, Salary, Chevron */}
                  <div className="dashboard-job-meta flex shrink-0 items-center gap-2">
                    <div className="text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${job.badge.bg} ${job.badge.text} ${job.badge.border}`}
                      >
                        {job.badge.label}
                      </span>
                      <span className="block whitespace-nowrap text-xs sm:text-sm font-bold text-slate-900 mt-1">
                        {job.salary}
                      </span>
                    </div>
                    <Icon
                      name="chevronRight"
                      className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </MotionConfig>
  );
}
