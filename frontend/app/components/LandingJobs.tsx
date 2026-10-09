'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { labelOf, WORK_TYPE_OPTIONS } from '../lib/jobOptions';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type PublicJob = {
  id: string;
  title: string;
  city: string;
  state: string;
  workType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryNegotiable: boolean;
  specializations: string[];
  publishedAt: string | null;
  createdAt: string;
  company: { name: string; verified: boolean };
};

type JobResults = {
  items: PublicJob[];
  total: number;
};

function salaryRange(job: PublicJob) {
  const money = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);

  if (job.salaryMin == null && job.salaryMax == null) return 'Salary not listed';
  if (job.salaryMin != null && job.salaryMax != null) {
    return `${money(job.salaryMin)}–${money(job.salaryMax)} / mo`;
  }
  return job.salaryMin != null
    ? `From ${money(job.salaryMin)} / mo`
    : `Up to ${money(job.salaryMax!)} / mo`;
}

function locationText(job: PublicJob) {
  return [job.city, job.state].filter(Boolean).join(', ') || 'Location not specified';
}

function usePublicJobs(query: string, limit: number, category = '') {
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: '1' });
        if (query.trim()) params.set('q', query.trim());
        if (category) params.set('category', category);
        const response = await fetch(`${API}/jobs?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Could not load current jobs.');
        const result = (await response.json()) as JobResults;
        setJobs(result.items.slice(0, limit));
        setTotal(result.total);
        setError('');
      } catch (err) {
        if (controller.signal.aborted) return;
        setJobs([]);
        setTotal(0);
        setError(
          err instanceof TypeError
            ? 'Live jobs are unavailable. Please try again shortly.'
            : err instanceof Error
              ? err.message
              : 'Could not load current jobs.',
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query || category ? 250 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, limit, category]);

  return { jobs, total, loading, error };
}

function JobCard({ job, index }: { job: PublicJob; index: number }) {
  const initials = job.company.name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  const tones = ['blue', 'violet', 'orange'];
  const posted = job.publishedAt || job.createdAt;
  const daysAgo = Math.floor((Date.now() - new Date(posted).getTime()) / 86_400_000);
  const postedLabel = daysAgo <= 0 ? 'Posted today' : daysAgo === 1 ? 'Posted yesterday' : `Posted ${daysAgo} days ago`;

  return (
    <article className={`job-card job-card-${index}`}>
      <div className="job-card-top">
        <div className={`company-logo ${tones[index % tones.length]}`}>{initials || 'CO'}</div>
        <div className="job-company">
          <span>{job.company.name}</span>
          <small>{job.company.verified ? 'Verified employer' : 'Employer'}</small>
        </div>
        <span className="job-tag featured">Active</span>
      </div>
      <h3>{job.title}</h3>
      <div className="job-meta">
        <span><span aria-hidden="true">⌖</span>{locationText(job)} · {labelOf(WORK_TYPE_OPTIONS, job.workType)}</span>
        <span><span aria-hidden="true">₹</span>{salaryRange(job)}{job.salaryNegotiable ? ' · Negotiable' : ''}</span>
      </div>
      {!!job.specializations?.length && (
        <div className="job-specializations">
          {job.specializations.slice(0, 3).map((specialization) => (
            <span key={specialization}>{specialization}</span>
          ))}
        </div>
      )}
      <div className="job-card-bottom">
        <span>{postedLabel}</span>
        <Link href={`/jobs/${job.id}`}>View role <span aria-hidden="true">→</span></Link>
      </div>
    </article>
  );
}

function JobSearch({ query, onChange, onSubmit }: {
  query: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="mini-search" role="search" onSubmit={onSubmit}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </svg>
      <input
        aria-label="Search current jobs"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search jobs, skills or companies"
      />
      <button type="submit" aria-label="See all matching jobs">→</button>
    </form>
  );
}

export function LandingJobPreview() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { jobs, total, loading, error } = usePublicJobs(query, 2);
  const browseHref = query.trim() ? `/jobs?q=${encodeURIComponent(query.trim())}` : '/jobs';

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(browseHref);
  }

  return (
    <div className="job-window">
      <div className="window-head">
        <div><span className="window-title">Latest opportunities</span><span className="window-sub">Live jobs from verified employers</span></div>
        <span className="match-score">{total.toLocaleString()} jobs</span>
      </div>
      <JobSearch query={query} onChange={setQuery} onSubmit={submitSearch} />
      {loading && <p className="landing-jobs-message" role="status">Loading current jobs…</p>}
      {!loading && error && <p className="landing-jobs-message" role="status">{error}</p>}
      {!loading && !error && jobs.length === 0 && (
        <p className="landing-jobs-message" role="status">{query ? 'No jobs match that search.' : 'No active jobs are available right now.'}</p>
      )}
      {!error && jobs.map((job, index) => <JobCard key={job.id} job={job} index={index} />)}
      <div className="window-footer">
        <span>{total.toLocaleString()} active {total === 1 ? 'job' : 'jobs'}</span>
        <Link href={browseHref}>Browse jobs <span aria-hidden="true">→</span></Link>
      </div>
    </div>
  );
}

export function LandingJobsShowcase() {
  const [category, setCategory] = useState('');
  const categories = ['Mobile Technician', 'Laptop Technician', 'AC Technician', 'Electrical Technician'];
  const moreCategories = ['Chip-Level Engineer', 'Trainee / Apprentice', 'Team Lead / Supervisor', 'Other'];
  const { jobs, loading, error } = usePublicJobs('', 3, category);

  return (
    <div className="landing-job-listing">
      <div className="landing-job-toolbar">
        <div className="landing-job-filters" role="group" aria-label="Filter jobs by category">
          <button type="button" className={`landing-filter-button ${!category ? 'selected' : ''}`} onClick={() => setCategory('')}>All Jobs</button>
          {categories.map((item) => (
            <button key={item} type="button" className={`landing-filter-button ${category === item ? 'selected' : ''}`} onClick={() => setCategory(item)}>{item}</button>
          ))}
          <select
            className={`landing-filter-more ${moreCategories.includes(category) ? 'selected' : ''}`}
            aria-label="More job categories"
            value={moreCategories.includes(category) ? category : ''}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">More categories</option>
            {moreCategories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <Link href="/jobs" className="landing-browse-all">Browse all jobs <span aria-hidden="true">→</span></Link>
      </div>
      <div className="job-showcase">
      {loading && <p className="landing-jobs-message" role="status">Loading current jobs…</p>}
      {!loading && error && <p className="landing-jobs-message" role="status">{error}</p>}
      {!loading && !error && jobs.length === 0 && <p className="landing-jobs-message" role="status">No active jobs are available right now.</p>}
      {!error && jobs.map((job, index) => <JobCard key={job.id} job={job} index={index} />)}
      </div>
    </div>
  );
}
