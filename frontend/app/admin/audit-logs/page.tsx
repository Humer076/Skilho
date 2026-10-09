'use client';

import { useEffect, useState } from 'react';
import AdminShell from '../components/AdminShell';
import { adminFetch } from '../components/adminApi';

const ACTIONS = [
  'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SUSPEND', 'STATUS_CHANGE',
  'LOGIN', 'LOGOUT', 'PAYMENT_VERIFIED', 'PAYMENT_FAILED', 'ROLE_CHANGE', 'PUBLISH', 'UNPUBLISH',
];
type AuditLog = {
  id: string; action: string; entityType: string; entityId: string | null; summary: string;
  metadata: unknown; createdAt: string;
  actor: { email: string | null; displayName: string | null } | null;
};
type PageData = { items: AuditLog[]; total: number; page: number; totalPages: number };
const inputClass = 'rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500';

function actionLabel(action: string) {
  return action.toLowerCase().split('_').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ');
}

export default function AuditLogsPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [action, setAction] = useState('');
  const [entityTypeInput, setEntityTypeInput] = useState('');
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => { setPage(1); setEntityType(entityTypeInput.trim()); }, 250);
    return () => window.clearTimeout(timer);
  }, [entityTypeInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    const params = new URLSearchParams({ page: String(page) });
    if (action) params.set('action', action);
    if (entityType) params.set('entityType', entityType);
    adminFetch<PageData>(`/admin/manage/audit-logs?${params}`)
      .then((data) => { if (!cancelled) { setItems(data.items); setTotal(data.total); setPages(data.totalPages); } })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [action, entityType, page, refresh]);

  return <AdminShell><div className="w-full space-y-4 text-slate-100">
    <div className="-mx-4 -mt-4 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 sm:-mx-7 sm:-mt-7 sm:px-6"><h1 className="text-base font-semibold">Audit Logs</h1><button type="button" aria-label="Refresh logs" onClick={() => setRefresh((value) => value + 1)} className="text-xl text-slate-400 hover:text-white">↻</button></div>
    {error && <p role="alert" className="rounded-lg border border-red-900 bg-red-950/50 px-4 py-2 text-sm text-red-300">{error}</p>}
    <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
        <select aria-label="Filter actions" value={action} onChange={(event) => { setAction(event.target.value); setPage(1); }} className={`${inputClass} min-w-44`}><option value="">All actions</option>{ACTIONS.map((value) => <option key={value} value={value}>{actionLabel(value)}</option>)}</select>
        <input value={entityTypeInput} onChange={(event) => setEntityTypeInput(event.target.value)} placeholder="Filter by entity type (e.g. CompanyVerification)" className={`${inputClass} w-full sm:w-80`} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead className="bg-slate-950/70 text-xs font-semibold uppercase tracking-wide text-slate-400"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Summary</th><th className="px-4 py-3">Entity</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Loading audit logs…</td></tr> : items.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">No audit logs found.</td></tr> : items.map((log) => <tr key={log.id} onClick={() => setExpanded(expanded === log.id ? '' : log.id)} className="cursor-pointer border-t border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800/70">
            <td className="whitespace-nowrap px-4 py-3 text-slate-300">{new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</td>
            <td className="px-4 py-3"><span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs">{actionLabel(log.action)}</span></td>
            <td className="max-w-[250px] px-4 py-3"><p className="truncate font-medium text-slate-100">{log.actor?.displayName || log.actor?.email || 'System'}</p>{log.actor?.displayName && <p className="truncate text-xs text-slate-500">{log.actor.email}</p>}</td>
            <td className="max-w-[440px] px-4 py-3"><p className="truncate">{log.summary}</p>{expanded === log.id && log.metadata != null && <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-md bg-slate-950 p-3 text-xs text-slate-400">{JSON.stringify(log.metadata, null, 2)}</pre>}</td>
            <td className="max-w-[210px] px-4 py-3"><p className="truncate text-slate-300">{log.entityType}</p>{log.entityId && <p className="truncate text-xs text-slate-500">{log.entityId}</p>}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-4 py-3 text-xs text-slate-400"><span>Showing {total === 0 ? 0 : (page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</span><div className="flex items-center gap-3"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-600 px-3 py-2 disabled:opacity-40">Previous</button><span>Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-600 px-3 py-2 disabled:opacity-40">Next</button></div></div>
    </section>
  </div></AdminShell>;
}
