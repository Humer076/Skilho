'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const TOKEN_KEY = 'skilho_admin_token';

const DOC_LABELS: Record<string, string> = {
  REGISTRATION_CERTIFICATE: 'Company registration certificate',
  GST_CERTIFICATE: 'GST certificate',
  SHOP_ESTABLISHMENT_CERTIFICATE: 'Shop and establishment certificate',
  BUSINESS_ADDRESS_PROOF: 'Business address proof',
  AUTHORIZED_PERSON_ID: 'Authorized person ID proof',
  OTHER: 'Other supporting document',
};

type Doc = {
  id: string;
  type: string;
  originalName: string;
  size: number;
  createdAt: string;
};

type EventItem = {
  id: string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  visibleToEmployer: boolean;
  createdAt: string;
};

type Company = {
  id: string;
  companyName: string;
  legalName: string | null;
  website: string | null;
  companyEmail: string | null;
  companyPhone: string | null;
  companyType: string | null;
  establishedYear: number | null;
  registrationDetails: string | null;
  gstNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  employeeCount: number | null;
  technicianCount: number | null;
  branchCount: number | null;
  specializations: string[];
  description: string | null;
  authorizedName: string | null;
  authorizedDesignation: string | null;
  authorizedMobile: string | null;
  authorizedEmail: string | null;
  verificationStatus: string;
  user: { email: string | null; mobile: string | null };
  documents: Doc[];
  events: EventItem[];
};

const STATUS_STYLE: Record<string, { pill: string; dot: string }> = {
  APPROVED: { pill: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  REJECTED: { pill: 'bg-rose-50 text-rose-700 ring-rose-600/20', dot: 'bg-rose-500' },
  SUSPENDED: { pill: 'bg-slate-100 text-slate-700 ring-slate-500/20', dot: 'bg-slate-500' },
  UNDER_REVIEW: { pill: 'bg-sky-50 text-sky-700 ring-sky-600/20', dot: 'bg-sky-500' },
  PENDING_VERIFICATION: { pill: 'bg-amber-50 text-amber-800 ring-amber-600/20', dot: 'bg-amber-500' },
};

const pretty = (s: string | null) => (s ? s.replace(/_/g, ' ') : '');

function show(value: string | number | null | undefined) {
  return value === null || value === undefined || value === '' ? '-' : String(value);
}

function eventText(ev: EventItem) {
  if (ev.action === 'STATUS_CHANGE') {
    return `Status changed: ${pretty(ev.fromStatus)} → ${pretty(ev.toStatus)}`;
  }
  if (ev.action === 'DOCUMENT_REQUEST') return 'Additional documents requested';
  return 'Internal note';
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.PENDING_VERIFICATION;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${s.pill}`}
    >
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {pretty(status)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Motion / polish layer (visual only — no logic)                     */
/* ------------------------------------------------------------------ */
const STYLES = `
  @keyframes adUp   { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes adIn   { from { opacity: 0; } to { opacity: 1; } }
  @keyframes adPop  { from { opacity: 0; transform: translateY(14px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes adShimmer { 100% { transform: translateX(100%); } }
  @keyframes adSpin { to { transform: rotate(360deg); } }

  .ad-up   { animation: adUp .6s cubic-bezier(.22,.61,.36,1) both; }
  .ad-pop  { animation: adPop .45s cubic-bezier(.22,.61,.36,1) both; }
  .ad-in   { animation: adIn .8s ease both; }
  .ad-spin { animation: adSpin .8s linear infinite; }

  .ad-card { transition: transform .3s cubic-bezier(.22,.61,.36,1), box-shadow .3s ease, border-color .3s ease; }

  .ad-shimmer { position: relative; overflow: hidden; }
  .ad-shimmer::after {
    content: ''; position: absolute; inset: 0; transform: translateX(-100%);
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.75), transparent);
    animation: adShimmer 1.5s infinite;
  }

  .ad-tile { transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease, background-color .2s ease, color .2s ease; }
  .ad-tile:hover { transform: translateY(-1px) scale(1.03); }

  .ad-link-arrow { transition: transform .2s ease; }
  .ad-link:hover .ad-link-arrow { transform: translateX(-4px); }

  .ad-timeline-item { transition: transform .25s ease, background-color .25s ease; }
  .ad-timeline-item:hover { transform: translateX(3px); }

  @media (prefers-reduced-motion: reduce) {
    .ad-up, .ad-pop, .ad-in, .ad-shimmer::after, .ad-spin { animation: none !important; opacity: 1 !important; }
    .ad-tile:hover, .ad-timeline-item:hover { transform: none; }
  }
`;

/* ------------------------------------------------------------------ */
/*  Building blocks                                                    */
/* ------------------------------------------------------------------ */

function Section({
  title, icon, children, delay = 0, action,
}: { title: string; icon: React.ReactNode; children: React.ReactNode; delay?: number; action?: React.ReactNode }) {
  return (
    <section
      className="ad-up overflow-hidden rounded-xl ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(12,16,19,.04),0_10px_28px_-14px_rgba(15,88,112,.14)] bg-white shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <h2 className="flex items-center gap-2.5 font-bold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-600 ring-1 ring-indigo-100">
            {icon}
          </span>
          {title}
        </h2>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Field({ name, value }: { name: string; value: string | number | null | undefined }) {
  const empty = value === null || value === undefined || value === '';
  return (
    <div className="rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-slate-200 hover:bg-slate-50/60">
      <dt className="text-xs font-medium text-slate-400">{name}</dt>
      <dd className={`mt-0.5 break-words text-sm ${empty ? 'text-slate-400' : 'font-medium text-slate-900'}`}>
        {show(value)}
      </dd>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6" aria-label="Loading company">
      <div className="ad-shimmer h-5 w-40 rounded-full bg-slate-200" />
      <div className="flex items-center justify-between">
        <div className="ad-shimmer h-9 w-64 rounded-xl bg-slate-200" />
        <div className="ad-shimmer h-8 w-32 rounded-full bg-slate-200" />
      </div>
      <div className="ad-shimmer h-56 rounded-2xl bg-slate-200" />
      <div className="ad-shimmer h-40 rounded-2xl bg-slate-200" />
      <div className="ad-shimmer h-64 rounded-2xl bg-slate-200" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminCompanyPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [company, setCompany] = useState<Company | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
  });

  const load = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    try {
      const res = await fetch(`${API}/admin/employers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem(TOKEN_KEY);
        router.replace('/admin/login');
        return;
      }
      if (!res.ok) throw new Error('Company not found');
      setCompany(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load company');
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function send(path: string, body: Record<string, unknown>, okText: string) {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const res = await fetch(`${API}/admin/employers/${id}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;
        throw new Error(msg || 'Action failed');
      }
      setNote('');
      setMessage(okText);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  function changeStatus(status: string, needsReason: boolean) {
    if (needsReason && !note.trim()) {
      setError('Please write a reason in the box first.');
      return;
    }
    if (!window.confirm(`Change status to ${pretty(status)}?`)) return;
    send('status', { status, note: note.trim() }, `Status changed to ${pretty(status)}.`);
  }

  function addNote() {
    if (!note.trim()) {
      setError('Please write something in the box first.');
      return;
    }
    send('note', { note: note.trim() }, 'Internal note saved.');
  }

  function requestDocs() {
    if (!note.trim()) {
      setError('Write which documents you need in the box first.');
      return;
    }
    send('request-documents', { note: note.trim() }, 'Document request saved.');
  }

  async function viewDoc(doc: Doc) {
    setError('');
    const win = window.open('', '_blank');
    try {
      const res = await fetch(`${API}/admin/documents/${doc.id}/download`, {
        headers: authHeader(),
      });
      if (!res.ok) throw new Error('Could not open the document');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (win) win.location.href = url;
    } catch (err) {
      if (win) win.close();
      setError(err instanceof Error ? err.message : 'Could not open the document');
    }
  }

  if (!company) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
        <style>{STYLES}</style>
        {error ? (
          <div className="flex min-h-screen items-center justify-center">
            <div className="surface ad-pop max-w-md p-8 text-center shadow-xl">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                  <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-red-700">{error}</p>
              <Link href="/admin/companies" className="btn-primary ad-tile mt-4 inline-flex">Back to companies</Link>
            </div>
          </div>
        ) : (
          <Skeleton />
        )}
      </main>
    );
  }

  const status = company.verificationStatus;

  const companyRows: [string, string | number | null][] = [
    ['Legal name', company.legalName],
    ['Login email', company.user.email ?? company.user.mobile],
    ['Company email', company.companyEmail],
    ['Company phone', company.companyPhone],
    ['Website', company.website],
    ['Company type', company.companyType],
    ['Established', company.establishedYear],
    ['Registration details', company.registrationDetails],
    ['GST number', company.gstNumber],
    ['Address', company.address],
    ['City', company.city],
    ['State', company.state],
    ['Country', company.country],
    ['Pincode', company.pincode],
    ['Employees', company.employeeCount],
    ['Technicians', company.technicianCount],
    ['Branches', company.branchCount],
    ['Specializations', company.specializations.join(', ')],
    ['Description', company.description],
  ];

  const personRows: [string, string | null][] = [
    ['Full name', company.authorizedName],
    ['Designation', company.authorizedDesignation],
    ['Mobile', company.authorizedMobile],
    ['Email', company.authorizedEmail],
  ];

  const actions = [
    {
      label: 'Mark under review',
      onClick: () => changeStatus('UNDER_REVIEW', false),
      disabled: busy || status === 'UNDER_REVIEW',
      cls: 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white shadow-md',
      icon: 'M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    },
    {
      label: 'Approve',
      onClick: () => changeStatus('APPROVED', false),
      disabled: busy || status === 'APPROVED',
      cls: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md',
      icon: 'm5 13 4 4L19 7',
    },
    {
      label: 'Reject',
      onClick: () => changeStatus('REJECTED', true),
      disabled: busy || status === 'REJECTED',
      cls: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-md',
      icon: 'M6 18 18 6M6 6l12 12',
    },
    {
      label: 'Suspend',
      onClick: () => changeStatus('SUSPENDED', true),
      disabled: busy || status === 'SUSPENDED',
      cls: 'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white shadow-md',
      icon: 'M10 9v6m4-6v6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    },
    {
      label: 'Request documents',
      onClick: requestDocs,
      disabled: busy,
      cls: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z',
    },
    {
      label: 'Add internal note',
      onClick: addNote,
      disabled: busy,
      cls: 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 shadow-sm',
      icon: 'M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586Z',
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 text-slate-900 antialiased">
      <style>{STYLES}</style>

      <div className="mx-auto max-w-4xl space-y-6">
        {/* ---------- Header ---------- */}
        <div className="ad-up">
          <Link
            href="/admin/companies"
            className="ad-link ad-link-arrow inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition hover:text-brand-800"
          >
            <span className="ad-link-arrow">←</span> Back to companies
          </Link>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <h1 className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-700 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
              {company.companyName}
            </h1>
            <StatusBadge status={status} />
          </div>
        </div>

        {/* ---------- Company details ---------- */}
        <Section
          title="Company details"
          delay={60}
          icon={
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        >
          <dl className="grid gap-x-4 gap-y-1 md:grid-cols-2">
            {companyRows.map(([name, value]) => (
              <Field key={name} name={name} value={value} />
            ))}
          </dl>
        </Section>

        {/* ---------- Authorized person ---------- */}
        <Section
          title="Authorized person"
          delay={120}
          icon={
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        >
          <dl className="grid gap-x-4 gap-y-1 md:grid-cols-2">
            {personRows.map(([name, value]) => (
              <Field key={name} name={name} value={value} />
            ))}
          </dl>
        </Section>

        {/* ---------- Documents ---------- */}
        <Section
          title={`Documents (${company.documents.length})`}
          delay={180}
          icon={
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6ZM14 2v6h6M9 13h6M9 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        >
          {company.documents.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">No documents uploaded.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {company.documents.map((doc, i) => (
                <li
                  key={doc.id}
                  className="ad-up flex items-center justify-between gap-4 py-3"
                  style={{ animationDelay: `${200 + i * 40}ms` }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-600 ring-1 ring-indigo-100">
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6ZM14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {DOC_LABELS[doc.type] ?? doc.type}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {doc.originalName} · {Math.max(1, Math.round(doc.size / 1024))} KB ·{' '}
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => viewDoc(doc)}
                    className="ad-tile shrink-0 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    View
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* ---------- Verification actions ---------- */}
        <Section
          title="Verification actions"
          delay={240}
          icon={
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M9 12l2 2 4-4M12 3 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        >
          <p className="mb-4 rounded-lg border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
            <span className="font-semibold">How this works:</span> Write a reason or note in the box.
            It is required for <strong>Reject</strong> and <strong>Suspend</strong>. Reasons for Reject,
            Suspend and document requests are meant for the employer. Internal notes stay private.
          </p>

          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            placeholder="Reason, note, or list of documents needed..."
            className="mb-4 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          {error && (
            <div role="alert" className="ad-pop mb-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700">
              <span aria-hidden>⚠️</span> {error}
            </div>
          )}
          {message && (
            <div role="status" className="ad-pop mb-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
              <span aria-hidden>✓</span> {message}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {actions.map((a) => (
              <button
                key={a.label}
                disabled={a.disabled}
                onClick={a.onClick}
                className={`ad-tile inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${a.cls}`}
              >
                {busy ? (
                  <svg className="ad-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                    <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path d={a.icon} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {a.label}
              </button>
            ))}
          </div>
        </Section>

        {/* ---------- Verification history ---------- */}
        <Section
          title="Verification history"
          delay={300}
          icon={
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M12 8v4l3 3M3.05 11a9 9 0 1 1 .5 4m-.5-4v-4m0 4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        >
          {company.events.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                  <path d="M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">No activity yet.</p>
            </div>
          ) : (
            <ol className="relative space-y-5 border-l-2 border-slate-200 pl-6">
              {company.events.map((ev, i) => {
                const isEmployer = ev.visibleToEmployer;
                return (
                  <li
                    key={ev.id}
                    className="ad-up ad-timeline-item relative"
                    style={{ animationDelay: `${320 + i * 50}ms` }}
                  >
                    <span
                      className={`absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${
                        isEmployer ? 'bg-indigo-500' : 'bg-slate-400'
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    </span>
                    <div className="rounded-xl ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(12,16,19,.04),0_10px_28px_-14px_rgba(15,88,112,.14)] bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{eventText(ev)}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            isEmployer
                              ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                              : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
                          }`}
                        >
                          {isEmployer ? 'For employer' : 'Internal'}
                        </span>
                      </div>
                      {ev.note && <p className="mt-1.5 text-sm text-slate-700">{ev.note}</p>}
                      <p className="mt-2 text-xs text-slate-400">
                        {new Date(ev.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Section>
      </div>
    </main>
  );
}
