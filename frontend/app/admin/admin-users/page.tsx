'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminShell, { ADMIN_TOKEN_KEY } from '../components/AdminShell';
import { adminFetch } from '../components/adminApi';

type AdminAccess = 'SUPER_ADMIN' | 'VERIFICATION' | 'PAYMENTS' | 'CONTENT';
type AdminUser = { id: string; email: string | null; displayName: string | null; adminAccess: AdminAccess; adminStatus: string; createdAt: string };
type PageData = { items: AdminUser[]; total: number; page: number; totalPages: number };
type PendingStatus = { user: AdminUser; status: 'SUSPENDED' | 'ACTIVE' };
const ACCESS: AdminAccess[] = ['SUPER_ADMIN', 'VERIFICATION', 'PAYMENTS', 'CONTENT'];
const inputClass = 'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500';

function accessLabel(value: AdminAccess) {
  if (value === 'SUPER_ADMIN') return 'Super Admin';
  return value[0] + value.slice(1).toLowerCase();
}

function initials(name: string | null, email: string | null) {
  const parts = (name || email || 'Admin').split(/[\s@._-]+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]).join('').toUpperCase();
}

export default function AdminUsersPage() {
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [tick, setTick] = useState(0);
  const [currentAdminId, setCurrentAdminId] = useState('');
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [access, setAccess] = useState<AdminAccess>('SUPER_ADMIN');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmingAction, setConfirmingAction] = useState<PendingStatus | null>(null);
  const [acting, setActing] = useState(false);
  const [updatingAccessId, setUpdatingAccessId] = useState('');
  const reload = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    try {
      const encoded = localStorage.getItem(ADMIN_TOKEN_KEY)?.split('.')[1];
      if (encoded) {
        const payload = JSON.parse(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')));
        setCurrentAdminId(payload.sub || payload.id || '');
      }
    } catch { /* The backend still protects the signed-in admin account. */ }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { setPage(1); setQuery(searchInput.trim()); }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setListError('');
    const params = new URLSearchParams({ page: String(page) });
    if (query) params.set('q', query);
    if (status) params.set('status', status);
    adminFetch<PageData>(`/admin/manage/admin-users?${params}`)
      .then((data) => { if (!cancelled) { setRows(data.items); setTotal(data.total); setPages(data.totalPages); } })
      .catch((error: Error) => { if (!cancelled) setListError(error.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [query, status, page, tick]);

  async function createAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormError(''); setSubmitting(true);
    try {
      await adminFetch('/admin/manage/admin-users', { method: 'POST', body: JSON.stringify({ email: email.trim(), displayName: displayName.trim() || undefined, password, adminAccess: access }) });
      setCreating(false); setEmail(''); setDisplayName(''); setPassword(''); setAccess('SUPER_ADMIN'); setNotice('Admin account created.'); reload();
    } catch (error) { setFormError(error instanceof Error ? error.message : 'Failed to create admin.'); }
    finally { setSubmitting(false); }
  }

  async function changeAccess(user: AdminUser, adminAccess: AdminAccess) {
    setActionError(''); setUpdatingAccessId(user.id);
    try { await adminFetch(`/admin/manage/admin-users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ adminAccess }) }); reload(); }
    catch (error) { setActionError(error instanceof Error ? error.message : 'Access update failed.'); }
    finally { setUpdatingAccessId(''); }
  }

  async function confirmStatusChange() {
    if (!confirmingAction) return;
    setActionError(''); setActing(true);
    try {
      await adminFetch(`/admin/manage/admin-users/${confirmingAction.user.id}`, { method: 'PATCH', body: JSON.stringify({ adminStatus: confirmingAction.status }) });
      setNotice(confirmingAction.status === 'ACTIVE' ? 'Admin reactivated.' : 'Admin suspended.');
      setConfirmingAction(null); reload();
    } catch (error) { setActionError(error instanceof Error ? error.message : 'Status update failed.'); setConfirmingAction(null); }
    finally { setActing(false); }
  }

  return <AdminShell><div className="w-full space-y-4 text-slate-100">
    <div className="-mx-4 -mt-4 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 sm:-mx-7 sm:-mt-7 sm:px-6"><h1 className="text-base font-semibold">Admin Users</h1><span className="text-xs text-slate-500">{total} administrators</span></div>
    {notice && <p role="status" className="rounded-lg border border-emerald-900 bg-emerald-950/50 px-4 py-2 text-sm text-emerald-300">{notice}</p>}
    {actionError && <p role="alert" className="rounded-lg border border-red-900 bg-red-950/50 px-4 py-2 text-sm text-red-300">{actionError}</p>}

    <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
        <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search admins…" className={`${inputClass} sm:w-72`} />
        <select aria-label="Filter admins by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className={`${inputClass} sm:w-40`}><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="DEACTIVATED">Deactivated</option></select>
        <button type="button" onClick={() => { setCreating(true); setFormError(''); }} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">Create admin</button>
      </div>
      {listError ? <div className="p-4 text-sm text-red-300">{listError}<button type="button" onClick={reload} className="ml-3 underline">Retry</button></div> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] border-collapse text-left text-sm">
        <thead className="bg-slate-950/70 text-xs font-semibold uppercase tracking-wide text-slate-400"><tr><th className="px-4 py-3">Admin</th><th className="px-4 py-3">Access</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
        <tbody>{loading ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Loading admins…</td></tr> : rows.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">No admin users found. Try adjusting the search.</td></tr> : rows.map((user) => {
          const isSelf = user.id === currentAdminId;
          return <tr key={user.id} className="border-t border-slate-800 bg-slate-900 text-slate-200 even:bg-slate-800/40">
            <td className="px-4 py-3"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-950 text-[11px] font-semibold text-blue-400">{initials(user.displayName, user.email)}</span><div className="min-w-0"><p className="truncate font-medium text-slate-100">{user.displayName ?? '—'}{isSelf && <span className="ml-2 rounded-full bg-blue-950 px-2 py-0.5 text-[10px] font-semibold text-blue-300">you</span>}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div></div></td>
            <td className="px-4 py-3"><select aria-label={`Access for ${user.email}`} value={user.adminAccess ?? 'SUPER_ADMIN'} disabled={isSelf || updatingAccessId === user.id} onChange={(event) => void changeAccess(user, event.target.value as AdminAccess)} title={isSelf ? 'You cannot change your own access' : 'Change admin access'} className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-100 disabled:cursor-not-allowed disabled:opacity-50">{ACCESS.map((value) => <option key={value} value={value}>{accessLabel(value)}</option>)}</select></td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-300">{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
            <td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-1 text-xs ${user.adminStatus === 'ACTIVE' ? 'border-emerald-800 bg-emerald-950/60 text-emerald-400' : 'border-slate-700 bg-slate-800 text-slate-300'}`}>{user.adminStatus[0] + user.adminStatus.slice(1).toLowerCase()}</span></td>
            <td className="px-4 py-3 text-right">{user.adminStatus === 'ACTIVE' ? <button type="button" disabled={isSelf} title={isSelf ? 'You cannot suspend your own account' : 'Suspend admin'} onClick={() => setConfirmingAction({ user, status: 'SUSPENDED' })} className="rounded-lg border border-rose-300/70 px-2.5 py-1.5 text-xs font-medium text-slate-100 hover:bg-rose-950/50 disabled:cursor-not-allowed disabled:opacity-40">Suspend</button> : <button type="button" onClick={() => setConfirmingAction({ user, status: 'ACTIVE' })} className="rounded-lg border border-emerald-700 px-2.5 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-950/50">Reactivate</button>}</td>
          </tr>;
        })}</tbody>
      </table></div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-4 py-3 text-xs text-slate-400"><span>Showing {total === 0 ? 0 : (page - 1) * 10 + 1}–{Math.min(page * 10, total)} of {total}</span><div className="flex items-center gap-3"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-600 px-3 py-2 disabled:opacity-40">Previous</button><span>Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-600 px-3 py-2 disabled:opacity-40">Next</button></div></div>
    </section>

    {creating && <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreating(false); }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4"><div role="dialog" aria-modal="true" aria-labelledby="create-admin-title" className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"><div className="mb-4 flex items-start justify-between"><div><h2 id="create-admin-title" className="text-lg font-semibold text-slate-100">Create admin user</h2><p className="mt-1 text-xs text-slate-400">Create a staff account and choose its access.</p></div><button type="button" onClick={() => setCreating(false)} aria-label="Close" className="text-xl text-slate-400 hover:text-white">×</button></div><form onSubmit={createAdmin} className="space-y-4">
      <label className="block text-sm font-medium text-slate-300">Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="colleague@skilho.com" className={`${inputClass} mt-1.5`} /></label>
      <label className="block text-sm font-medium text-slate-300">Display name (optional)<input type="text" maxLength={100} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className={`${inputClass} mt-1.5`} /></label>
      <label className="block text-sm font-medium text-slate-300">Temporary password (min 8 chars)<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className={`${inputClass} mt-1.5`} /><span className="mt-1 block text-xs text-slate-500">Share it securely; the admin can change it later.</span></label>
      <label className="block text-sm font-medium text-slate-300">Access<select value={access} onChange={(event) => setAccess(event.target.value as AdminAccess)} className={`${inputClass} mt-1.5`}>{ACCESS.map((value) => <option key={value} value={value}>{accessLabel(value)}</option>)}</select></label>
      {formError && <p role="alert" className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">{formError}</p>}
      <div className="flex justify-end gap-2 border-t border-slate-800 pt-4"><button type="button" onClick={() => setCreating(false)} className="rounded-lg border border-slate-600 px-3.5 py-2 text-sm text-slate-300 hover:bg-slate-800">Cancel</button><button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-40">{submitting ? 'Creating…' : 'Create admin'}</button></div>
    </form></div></div>}

    {confirmingAction && <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmingAction(null); }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"><h2 className="text-lg font-semibold text-slate-100">{confirmingAction.status === 'SUSPENDED' ? 'Suspend admin' : 'Reactivate admin'}</h2><p className="mt-3 text-sm leading-6 text-slate-300">{confirmingAction.status === 'SUSPENDED' ? `Suspend ${confirmingAction.user.email}? They will be unable to sign in to the admin panel.` : `Reactivate ${confirmingAction.user.email}? They will regain admin access.`}</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setConfirmingAction(null)} className="rounded-lg border border-slate-600 px-3.5 py-2 text-sm text-slate-300">Cancel</button><button type="button" disabled={acting} onClick={() => void confirmStatusChange()} className={`rounded-lg px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-40 ${confirmingAction.status === 'SUSPENDED' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>{acting ? 'Working…' : confirmingAction.status === 'SUSPENDED' ? 'Yes, suspend' : 'Yes, reactivate'}</button></div></div></div>}
  </div></AdminShell>;
}
