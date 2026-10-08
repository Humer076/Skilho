'use client';

import AuthImage from './AuthImage';
import {
  CAREER_EMPLOYMENT_OPTIONS,
  EMPLOYMENT_OPTIONS,
  SKILL_LEVEL_OPTIONS,
  STAGE_OPTIONS,
  labelOf,
} from '../lib/employeeOptions';

export type TechProfile = {
  id: string;
  fullName: string;
  professionalTitle: string | null;
  hasPhoto: boolean;
  verified: boolean;
  city: string | null;
  state: string | null;
  totalExperienceMonths: number | null;
  employmentStatus: string | null;
  expectedSalary: number | null;
  preferredLocation: string | null;
  immediateJoining: boolean;
  noticePeriodDays: number | null;
  skills: { name: string; level: string }[];
  experience: { mobile: number; android: number; iphone: number; laptop: number };
  career: {
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
  }[];
  education: {
    id: string;
    institution: string;
    qualification: string;
    fieldOfStudy: string | null;
    startYear: number | null;
    endYear: number | null;
  }[];
  certificates: {
    id: string;
    name: string;
    issuer: string | null;
    issuedYear: number | null;
  }[];
  contactShared: boolean;
  contact: { email: string | null; mobile: string | null } | null;
};

type Props = {
  profile: TechProfile;
  photoUrl: string;
  tokenKey: string;
};

const LEVEL_CLASS: Record<string, string> = {
  BEGINNER: 'bg-gray-100 text-gray-700',
  BASIC: 'bg-blue-50 text-blue-700',
  INTERMEDIATE: 'bg-blue-100 text-blue-800',
  ADVANCED: 'bg-green-100 text-green-800',
  EXPERT: 'bg-green-200 text-green-900',
};

function monthsText(months: number, zeroText: string) {
  if (months <= 0) return zeroText;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
  if (rest > 0) parts.push(`${rest} mo${rest > 1 ? 's' : ''}`);
  return parts.join(' ');
}

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
  return monthsText(months, 'less than a month');
}

export default function TechnicianProfileView({
  profile,
  photoUrl,
  tokenKey,
}: Props) {
  const initial = (profile.fullName.trim()[0] ?? 'T').toUpperCase();
  const place = [profile.city, profile.state].filter(Boolean).join(', ');

  let availability = 'Not specified';
  if (profile.immediateJoining) {
    availability = 'Available immediately';
  } else if (profile.noticePeriodDays != null) {
    availability = `Notice period: ${profile.noticePeriodDays} days`;
  }

  const journey = profile.career.map((c) =>
    c.endDate == null ? 'Current position' : labelOf(STAGE_OPTIONS, c.stage),
  );

  const facts: [string, string][] = [
    [
      'Total experience',
      profile.totalExperienceMonths == null
        ? 'Not specified'
        : monthsText(profile.totalExperienceMonths, 'Fresher'),
    ],
    [
      'Current status',
      profile.employmentStatus
        ? labelOf(EMPLOYMENT_OPTIONS, profile.employmentStatus)
        : 'Not specified',
    ],
    ['Availability', availability],
    [
      'Expected salary',
      profile.expectedSalary != null
        ? `Rs. ${profile.expectedSalary.toLocaleString('en-IN')} / month`
        : 'Not specified',
    ],
    ['Preferred location', profile.preferredLocation || 'Not specified'],
  ];

  const experienceRows: [string, number][] = [
    ['Mobile repair', profile.experience.mobile],
    ['Android', profile.experience.android],
    ['iPhone', profile.experience.iphone],
    ['Laptop repair', profile.experience.laptop],
  ];

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 shrink-0 flex items-center justify-center">
            {profile.hasPhoto ? (
              <AuthImage
                url={photoUrl}
                tokenKey={tokenKey}
                alt={profile.fullName || 'Technician'}
                className="w-24 h-24 object-cover"
                fallback={
                  <span className="text-3xl font-bold text-gray-500">{initial}</span>
                }
              />
            ) : (
              <span className="text-3xl font-bold text-gray-500">{initial}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {profile.fullName || 'Unnamed technician'}
            </h1>
            {profile.professionalTitle && (
              <p className="text-gray-600">{profile.professionalTitle}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {place && <span className="text-gray-500 text-sm">{place}</span>}
              {profile.verified ? (
                <span className="bg-green-100 text-green-800 text-xs font-semibold rounded-full px-2 py-1">
                  ✔ Verified technician
                </span>
              ) : (
                <span className="bg-gray-100 text-gray-600 text-xs rounded-full px-2 py-1">
                  Not verified yet
                </span>
              )}
            </div>
          </div>
        </div>

        <dl className="grid gap-4 grid-cols-2 md:grid-cols-3 mt-6">
          {facts.map(([name, value]) => (
            <div key={name}>
              <dt className="text-sm text-gray-500">{name}</dt>
              <dd className="text-gray-900 font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Repair experience
        </h2>
        <p className="text-gray-500 text-xs mb-4">
          Calculated from the career journey entries where the technician
          marked these skills. Each month is counted once.
        </p>
        <dl className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {experienceRows.map(([name, months]) => (
            <div key={name}>
              <dt className="text-sm text-gray-500">{name}</dt>
              <dd className="text-gray-900 font-medium">
                {monthsText(months, 'None recorded')}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
        {profile.skills.length === 0 ? (
          <p className="text-gray-500">No skills added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s) => (
              <span
                key={s.name}
                className={`text-sm rounded-full px-3 py-1 ${
                  LEVEL_CLASS[s.level] ?? 'bg-gray-100 text-gray-700'
                }`}
              >
                {s.name} · {labelOf(SKILL_LEVEL_OPTIONS, s.level)}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Career journey
        </h2>
        {profile.career.length === 0 ? (
          <p className="text-gray-500">No career entries yet.</p>
        ) : (
          <>
            <p className="text-sm text-gray-700 bg-gray-100 rounded-lg p-3 mb-5">
              {journey.join(' → ')}
            </p>
            <ul className="space-y-5">
              {profile.career.map((entry) => {
                const current = entry.endDate == null;
                return (
                  <li
                    key={entry.id}
                    className={`border-l-4 pl-4 ${
                      current ? 'border-green-500' : 'border-gray-300'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-gray-100 text-gray-700 text-xs rounded-full px-3 py-1">
                        {labelOf(STAGE_OPTIONS, entry.stage)}
                      </span>
                      {current && (
                        <span className="bg-green-100 text-green-800 text-xs font-semibold rounded-full px-3 py-1">
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
                            className="bg-blue-50 text-blue-700 text-xs rounded-full px-3 py-1"
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
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Education and certificates
        </h2>
        {profile.education.length === 0 && profile.certificates.length === 0 ? (
          <p className="text-gray-500">Nothing added yet.</p>
        ) : (
          <div className="space-y-4">
            {profile.education.length > 0 && (
              <ul className="space-y-2">
                {profile.education.map((row) => (
                  <li key={row.id}>
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
                  </li>
                ))}
              </ul>
            )}
            {profile.certificates.length > 0 && (
              <ul className="space-y-2">
                {profile.certificates.map((row) => (
                  <li key={row.id}>
                    <p className="text-gray-900 font-medium">{row.name}</p>
                    <p className="text-gray-500 text-sm">
                      {[row.issuer, row.issuedYear].filter(Boolean).join(' · ') ||
                        '-'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Contact details
        </h2>
        {profile.contactShared && profile.contact ? (
          <dl className="grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="text-gray-900">{profile.contact.email || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Mobile</dt>
              <dd className="text-gray-900">{profile.contact.mobile || '-'}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-gray-500">
            Contact details are private. The technician has not chosen to share
            them.
          </p>
        )}
      </section>
    </div>
  );
}