'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, MotionConfig, type Variants } from 'framer-motion';

const API = 'http://localhost:3001';
const MAX_SIZE = 5 * 1024 * 1024;

const DOC_TYPES: { value: string; label: string }[] = [
  { value: 'REGISTRATION_CERTIFICATE', label: 'Company registration certificate' },
  { value: 'GST_CERTIFICATE', label: 'GST certificate (if applicable)' },
  { value: 'SHOP_ESTABLISHMENT_CERTIFICATE', label: 'Shop and establishment certificate (if applicable)' },
  { value: 'BUSINESS_ADDRESS_PROOF', label: 'Business address proof' },
  { value: 'AUTHORIZED_PERSON_ID', label: 'Authorized person ID proof' },
  { value: 'OTHER', label: 'Other supporting document' },
];

type Doc = {
  id: string;
  type: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

function typeLabel(value: string) {
  return DOC_TYPES.find((t) => t.value === value)?.label ?? value;
}

/* ---------- motion helpers ---------- */

const EASE = [0.22, 1, 0.36, 1] as const;

const stagger = (gap = 0.07, delay = 0.05): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const cardIn: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

const rowIn: Variants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
};

/* ---------- animated background ---------- */

const BG_CSS = `
  @keyframes skilhoDrift1 {
    0%   { transform: translate3d(-8%, -6%, 0) scale(1); }
    50%  { transform: translate3d(10%, 8%, 0) scale(1.15); }
    100% { transform: translate3d(-8%, -6%, 0) scale(1); }
  }
  @keyframes skilhoDrift2 {
    0%   { transform: translate3d(6%, 10%, 0) scale(1.05); }
    50%  { transform: translate3d(-10%, -8%, 0) scale(1.2); }
    100% { transform: translate3d(6%, 10%, 0) scale(1.05); }
  }
  @keyframes skilhoDrift3 {
    0%   { transform: translate3d(0, 0, 0) scale(1); }
    33%  { transform: translate3d(-12%, 6%, 0) scale(1.1); }
    66%  { transform: translate3d(8%, -10%, 0) scale(0.95); }
    100% { transform: translate3d(0, 0, 0) scale(1); }
  }
  @keyframes skilhoGridShift {
    0%   { background-position: 0 0, 0 0; }
    100% { background-position: 60px 60px, 60px 60px; }
  }
  @keyframes skilhoShimmer {
    0%   { background-position: -600px 0; }
    100% { background-position: 600px 0; }
  }
  .skilho-bg-orb-1 { animation: skilhoDrift1 26s ease-in-out infinite; }
  .skilho-bg-orb-2 { animation: skilhoDrift2 32s ease-in-out infinite; }
  .skilho-bg-orb-3 { animation: skilhoDrift3 38s ease-in-out infinite; }
  .skilho-bg-grid {
    background-image:
      linear-gradient(to right, rgba(15, 23, 42, 0.045) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(15, 23, 42, 0.045) 1px, transparent 1px);
    background-size: 60px 60px, 60px 60px;
    animation: skilhoGridShift 24s linear infinite;
    -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, black 40%, transparent 100%);
            mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, black 40%, transparent 100%);
  }
  .skilho-shimmer {
    background: linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%);
    background-size: 1200px 100%;
    animation: skilhoShimmer 1.4s linear infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .skilho-bg-orb-1,
    .skilho-bg-orb-2,
    .skilho-bg-orb-3,
    .skilho-bg-grid,
    .skilho-shimmer {
      animation: none !important;
    }
  }
`;

function AnimatedBackground() {
  return (
    <>
      <style>{BG_CSS}</style>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-slate-50"
      >
        <div className="skilho-bg-orb-1 absolute -top-40 -left-32 h-[42rem] w-[42rem] rounded-full bg-blue-300/35 blur-[120px]" />
        <div className="skilho-bg-orb-2 absolute -top-20 right-[-12rem] h-[38rem] w-[38rem] rounded-full bg-violet-300/30 blur-[120px]" />
        <div className="skilho-bg-orb-3 absolute bottom-[-16rem] left-1/3 h-[36rem] w-[36rem] rounded-full bg-cyan-200/35 blur-[120px]" />
        <div className="skilho-bg-grid absolute inset-0" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/70 to-transparent" />
      </div>
    </>
  );
}

/* ---------- loading skeleton ---------- */

function LoadingState() {
  return (
    <main className="min-h-screen p-6 relative">
      <AnimatedBackground />
      <div className="max-w-3xl mx-auto relative z-10 space-y-6">
        <div className="skilho-shimmer h-4 w-40 rounded-full" />
        <div className="skilho-shimmer h-8 w-2/3 rounded-full" />
        <div className="skilho-shimmer h-4 w-3/4 rounded-full" />

        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-xl shadow-lg shadow-slate-200/50 p-6 space-y-4 mt-2">
          <div className="skilho-shimmer h-3 w-1/4 rounded-full" />
          <div className="skilho-shimmer h-12 w-full rounded-xl" />
          <div className="skilho-shimmer h-3 w-1/4 rounded-full" />
          <div className="skilho-shimmer h-12 w-full rounded-xl" />
          <div className="skilho-shimmer h-12 w-full rounded-xl" />
        </div>

        <div
          className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-xl shadow-lg shadow-slate-200/50 p-6 space-y-4"
          style={{ animationDelay: '120ms' }}
        >
          <div className="skilho-shimmer h-5 w-1/3 rounded-full" />
          <div className="skilho-shimmer h-3 w-full rounded-full" />
          <div className="skilho-shimmer h-3 w-5/6 rounded-full" />
        </div>
      </div>
    </main>
  );
}

export default function EmployerDocumentsPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState(DOC_TYPES[0].value);
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function getToken() {
    return localStorage.getItem('skilho_token');
  }

  function goToLogin() {
    localStorage.removeItem('skilho_token');
    router.replace('/login/employer');
  }

  async function loadDocs() {
    const token = getToken();
    if (!token) {
      goToLogin();
      return;
    }
    try {
      const res = await fetch(`${API}/employer/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Unauthorized');
      setDocs(await res.json());
      setLoading(false);
    } catch {
      goToLogin();
    }
  }

  useEffect(() => {
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!file) {
      setError('Please choose a file first');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File is too large (maximum 5 MB)');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('type', docType);
      formData.append('file', file);

      const res = await fetch(`${API}/employer/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;
        throw new Error(msg || 'Upload failed');
      }

      setMessage('Document uploaded successfully.');
      setFile(null);
      setFileKey((k) => k + 1);
      await loadDocs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleView(doc: Doc) {
    setError('');
    const win = window.open('', '_blank');
    try {
      const res = await fetch(`${API}/employer/documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${getToken()}` },
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

  async function handleDelete(doc: Doc) {
    if (!window.confirm(`Delete "${doc.originalName}"?`)) return;
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${API}/employer/documents/${doc.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not delete');
      setMessage('Document deleted.');
      await loadDocs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete');
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatedBackground />

      <main className="relative min-h-screen p-4 sm:p-5">
        <motion.div
          className="max-w-3xl mx-auto relative z-10"
          style={{ maxWidth: '48rem', marginLeft: 0, marginRight: 'auto' }}
          variants={stagger(0.07, 0.05)}
          initial="hidden"
          animate="show"
        >
          {/* Header */}
          <motion.div variants={rise}>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Company{' '}
              <span className="bg-gradient-to-r from-blue-700 to-violet-600 bg-clip-text text-transparent">
                Documents
              </span>
            </h1>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              PDF, JPG or PNG, maximum 5 MB each. Your documents are private and
              can only be seen by you and the Skilho admin team.
            </p>
          </motion.div>

          {/* Upload form */}
          <motion.form
            onSubmit={handleUpload}
            variants={rise}
            className="relative mt-4 space-y-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-200/40 sm:p-5"
          >
            {/* Top gradient accent */}
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-600 via-violet-500 to-violet-400"
            />

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Document type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 hover:border-slate-400"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">File</label>
              <input
                key={fileKey}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-slate-900 file:mr-3 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-blue-600 file:to-violet-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white file:cursor-pointer hover:file:shadow-md hover:file:shadow-blue-500/30 file:transition-shadow cursor-pointer"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="rounded-lg bg-red-50/90 border border-red-200 text-red-700 text-sm px-4 py-2"
              >
                {error}
              </motion.p>
            )}
            {message && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="rounded-lg bg-green-50/90 border border-green-200 text-green-700 text-sm px-4 py-2"
              >
                {message}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={uploading}
              whileHover={uploading ? undefined : { y: -1 }}
              whileTap={uploading ? undefined : { scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition-shadow hover:shadow-md hover:shadow-blue-500/30 disabled:opacity-50"
            >
              {uploading && (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              )}
              {uploading ? 'Uploading...' : 'Upload document'}
            </motion.button>
          </motion.form>

          {/* Documents list */}
          <motion.section
            variants={rise}
            className="relative mt-6 overflow-hidden bg-white/85 backdrop-blur-xl border border-white/60 rounded-xl shadow-lg shadow-slate-200/50 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
                Uploaded documents
              </h2>
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-100 text-blue-700 text-xs font-semibold px-3 py-1">
                {docs.length} {docs.length === 1 ? 'file' : 'files'}
              </span>
            </div>

            {docs.length === 0 ? (
              <p className="text-slate-500">
                No documents uploaded yet.
              </p>
            ) : (
              <motion.ul
                className="divide-y divide-slate-200"
                variants={stagger(0.05, 0.05)}
                initial="hidden"
                animate="show"
              >
                {docs.map((doc) => (
                  <motion.li
                    key={doc.id}
                    variants={rowIn}
                    className="py-3 flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/25 text-sm font-bold">
                        {doc.originalName.split('.').pop()?.toUpperCase().slice(0, 3) ?? 'DOC'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-slate-900 font-medium truncate tracking-tight">
                          {typeLabel(doc.type)}
                        </p>
                        <p className="text-slate-500 text-sm truncate">
                          {doc.originalName} ·{' '}
                          {Math.max(1, Math.round(doc.size / 1024))} KB ·{' '}
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleView(doc)}
                        className="border border-slate-300 bg-white/70 rounded-lg px-3 py-1.5 text-slate-700 text-sm hover:bg-white hover:border-slate-400 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(doc)}
                        className="border border-red-300 bg-white/70 rounded-lg px-3 py-1.5 text-red-600 text-sm hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </motion.section>
        </motion.div>
      </main>
    </MotionConfig>
  );
}
