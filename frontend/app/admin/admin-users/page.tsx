
'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminShell, { ADMIN_TOKEN_KEY } from '../components/AdminShell';
import { adminFetch } from '../components/adminApi';

type AdminAccess = 'SUPER_ADMIN' | 'VERIFICATION' | 'PAYMENTS' | 'CONTENT';

type AdminUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  adminAccess: AdminAccess;
  adminStatus: string;
  createdAt: string;
};

type PageData = {
  items: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
};

type PendingStatus = {
  user: AdminUser;
  status: 'SUSPENDED' | 'ACTIVE';
};

const ACCESS: AdminAccess[] = [
  'SUPER_ADMIN',
  'VERIFICATION',
  'PAYMENTS',
  'CONTENT',
];

const inputClass =
  'w-full min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

function accessLabel(value: AdminAccess) {
  if (value === 'SUPER_ADMIN') return 'Super Admin';
  return value[0] + value.slice(1).toLowerCase();
}

function statusLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function initials(name: string | null, email: string | null) {
  const parts = (name || email || 'Admin')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]).join('').toUpperCase();
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
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

  const [confirmingAction, setConfirmingAction] =
    useState<PendingStatus | null>(null);

  const [acting, setActing] = useState(false);
  const [updatingAccessId, setUpdatingAccessId] = useState('');

  const reload = useCallback(() => {
    setTick((value) => value + 1);
  }, []);

  // Identify the currently signed-in administrator.
  useEffect(() => {
    try {
      const encoded = localStorage
        .getItem(ADMIN_TOKEN_KEY)
        ?.split('.')[1];

      if (encoded) {
        const normalized = encoded
          .replace(/-/g, '+')
          .replace(/_/g, '/');

        const payload = JSON.parse(atob(normalized));

        setCurrentAdminId(payload.sub || payload.id || '');
      }
    } catch {
      // The backend still protects the signed-in admin account.
    }
  }, []);

  // Debounced search.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setQuery(searchInput.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Fetch administrators.
  useEffect(() => {
    let cancelled = false;

    async function fetchAdmins() {
      setLoading(true);
      setListError('');

      const params = new URLSearchParams({
        page: String(page),
      });

      if (query) params.set('q', query);
      if (status) params.set('status', status);

      try {
        const data = await adminFetch<PageData>(
          `/admin/manage/admin-users?${params.toString()}`
        );

        if (cancelled) return;

        setRows(data.items);
        setTotal(data.total);
        setPages(Math.max(1, data.totalPages));
      } catch (error) {
        if (!cancelled) {
          setListError(
            error instanceof Error
              ? error.message
              : 'Failed to load admin users.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchAdmins();

    return () => {
      cancelled = true;
    };
  }, [query, status, page, tick]);

  async function createAdmin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      await adminFetch('/admin/manage/admin-users', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          displayName: displayName.trim() || undefined,
          password,
          adminAccess: access,
        }),
      });

      setCreating(false);
      setEmail('');
      setDisplayName('');
      setPassword('');
      setAccess('SUPER_ADMIN');
      setNotice('Admin account created.');
      setActionError('');
      reload();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Failed to create admin.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function changeAccess(
    user: AdminUser,
    adminAccess: AdminAccess
  ) {
    setActionError('');
    setNotice('');
    setUpdatingAccessId(user.id);

    try {
      await adminFetch(`/admin/manage/admin-users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ adminAccess }),
      });

      setNotice(`Access updated for ${user.email || 'admin'}.`);
      reload();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Access update failed.'
      );
    } finally {
      setUpdatingAccessId('');
    }
  }

  async function confirmStatusChange() {
    if (!confirmingAction) return;

    setActionError('');
    setNotice('');
    setActing(true);

    try {
      await adminFetch(
        `/admin/manage/admin-users/${confirmingAction.user.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            adminStatus: confirmingAction.status,
          }),
        }
      );

      setNotice(
        confirmingAction.status === 'ACTIVE'
          ? 'Admin reactivated.'
          : 'Admin suspended.'
      );

      setConfirmingAction(null);
      reload();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Status update failed.'
      );

      setConfirmingAction(null);
    } finally {
      setActing(false);
    }
  }

  function openCreateModal() {
    setFormError('');
    setCreating(true);
  }

  return (
    <AdminShell>
      <div className="w-full min-w-0 space-y-4 overflow-x-hidden text-slate-100">

        {/* Responsive page header */}
        <div className="-mx-3 -mt-3 flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900 px-3 py-3 sm:-mx-7 sm:-mt-7 sm:px-6">
          <div>
            <h1 className="text-base font-semibold sm:text-lg">
              Admin Users
            </h1>
            <p className="mt-0.5 text-xs text-slate-400">
              Manage administrator accounts and permissions
            </p>
          </div>

          <span className="whitespace-nowrap text-xs text-slate-400">
            {total} administrators
          </span>
        </div>

        {/* Success and error messages */}
        {notice && (
          <div
            role="status"
            className="flex items-start justify-between gap-3 rounded-lg border border-emerald-900 bg-emerald-950/50 px-3 py-3 text-sm text-emerald-300 sm:px-4"
          >
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice('')}
              aria-label="Dismiss notification"
              className="shrink-0 text-lg leading-4"
            >
              ×
            </button>
          </div>
        )}

        {actionError && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-lg border border-red-900 bg-red-950/50 px-3 py-3 text-sm text-red-300 sm:px-4"
          >
            <span className="break-words">{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError('')}
              aria-label="Dismiss error"
              className="shrink-0 text-lg leading-4"
            >
              ×
            </button>
          </div>
        )}

        {/* Admin list */}
        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

          {/* Responsive toolbar */}
          <div className="grid grid-cols-1 gap-3 border-b border-slate-800 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-[minmax(0,1fr)_180px_auto] lg:items-center">
            <input
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder="Search admins..."
              aria-label="Search admins"
              className={inputClass}
            />

            <select
              aria-label="Filter admins by status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="DEACTIVATED">Deactivated</option>
            </select>

            <button
              type="button"
              onClick={openCreateModal}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 sm:col-span-2 lg:col-span-1"
            >
              + Create admin
            </button>
          </div>

          {/* List loading error */}
          {listError ? (
            <div className="p-4 text-sm text-red-300">
              <p>{listError}</p>
              <button
                type="button"
                onClick={reload}
                className="mt-2 underline"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* MOBILE: Responsive admin cards */}
              <div className="space-y-3 p-3 md:hidden">
                {loading ? (
                  <div className="py-12 text-center text-sm text-slate-400">
                    Loading admins...
                  </div>
                ) : rows.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-400">
                    No admin users found. Try adjusting the search.
                  </div>
                ) : (
                  rows.map((user) => {
                    const isSelf = user.id === currentAdminId;

                    return (
                      <article
                        key={user.id}
                        className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                      >
                        {/* Identity */}
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-950 text-xs font-semibold text-blue-300">
                            {initials(
                              user.displayName,
                              user.email
                            )}
                          </span>

                          <div className="min-w-0 flex-1">
                            <p className="break-words text-sm font-semibold text-slate-100">
                              {user.displayName || 'Unnamed admin'}

                              {isSelf && (
                                <span className="ml-2 inline-block rounded-full bg-blue-950 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                                  You
                                </span>
                              )}
                            </p>

                            <p className="mt-1 break-all text-xs text-slate-400">
                              {user.email || 'No email'}
                            </p>
                          </div>
                        </div>

                        {/* Access and status */}
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="min-w-0">
                            <p className="mb-1.5 text-xs text-slate-500">
                              Access
                            </p>

                            <select
                              aria-label={`Access for ${user.email}`}
                              value={user.adminAccess}
                              disabled={
                                isSelf ||
                                updatingAccessId === user.id
                              }
                              onChange={(event) =>
                                void changeAccess(
                                  user,
                                  event.target.value as AdminAccess
                                )
                              }
                              className="w-full min-w-0 rounded-lg border border-slate-700 bg-slate-900 px-2 py-2.5 text-xs text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {ACCESS.map((value) => (
                                <option
                                  key={value}
                                  value={value}
                                >
                                  {accessLabel(value)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <p className="mb-1.5 text-xs text-slate-500">
                              Status
                            </p>

                            <span
                              className={`inline-flex max-w-full rounded-full border px-2.5 py-2 text-xs ${
                                user.adminStatus === 'ACTIVE'
                                  ? 'border-emerald-800 bg-emerald-950/60 text-emerald-400'
                                  : 'border-slate-700 bg-slate-800 text-slate-300'
                              }`}
                            >
                              {statusLabel(user.adminStatus)}
                            </span>
                          </div>
                        </div>

                        {/* Created date */}
                        <div className="mt-3 text-xs text-slate-500">
                          Created: {formatDate(user.createdAt)}
                        </div>

                        {/* Actions */}
                        <div className="mt-3 border-t border-slate-800 pt-3">
                          {user.adminStatus === 'ACTIVE' ? (
                            <button
                              type="button"
                              disabled={isSelf}
                              title={
                                isSelf
                                  ? 'You cannot suspend your own account'
                                  : 'Suspend admin'
                              }
                              onClick={() =>
                                setConfirmingAction({
                                  user,
                                  status: 'SUSPENDED',
                                })
                              }
                              className="w-full rounded-lg border border-rose-800 px-3 py-2.5 text-sm font-medium text-rose-300 transition hover:bg-rose-950/50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Suspend admin
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmingAction({
                                  user,
                                  status: 'ACTIVE',
                                })
                              }
                              className="w-full rounded-lg border border-emerald-800 px-3 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-950/50"
                            >
                              Reactivate admin
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>

              {/* DESKTOP: Full admin table */}
              <div className="hidden min-w-0 overflow-x-auto md:block">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="bg-slate-950/70 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Admin</th>
                      <th className="px-4 py-3">Access</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-12 text-center text-slate-400"
                        >
                          Loading admins...
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-12 text-center text-slate-400"
                        >
                          No admin users found. Try adjusting the search.
                        </td>
                      </tr>
                    ) : (
                      rows.map((user) => {
                        const isSelf =
                          user.id === currentAdminId;

                        return (
                          <tr
                            key={user.id}
                            className="border-t border-slate-800 bg-slate-900 text-slate-200 even:bg-slate-800/40"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-950 text-[11px] font-semibold text-blue-400">
                                  {initials(
                                    user.displayName,
                                    user.email
                                  )}
                                </span>

                                <div className="min-w-0">
                                  <p className="truncate font-medium text-slate-100">
                                    {user.displayName || '—'}

                                    {isSelf && (
                                      <span className="ml-2 rounded-full bg-blue-950 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                                        You
                                      </span>
                                    )}
                                  </p>

                                  <p className="truncate text-xs text-slate-500">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <select
                                aria-label={`Access for ${user.email}`}
                                value={user.adminAccess}
                                disabled={
                                  isSelf ||
                                  updatingAccessId === user.id
                                }
                                onChange={(event) =>
                                  void changeAccess(
                                    user,
                                    event.target.value as AdminAccess
                                  )
                                }
                                title={
                                  isSelf
                                    ? 'You cannot change your own access'
                                    : 'Change admin access'
                                }
                                className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {ACCESS.map((value) => (
                                  <option
                                    key={value}
                                    value={value}
                                  >
                                    {accessLabel(value)}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                              {formatDate(user.createdAt)}
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs ${
                                  user.adminStatus === 'ACTIVE'
                                    ? 'border-emerald-800 bg-emerald-950/60 text-emerald-400'
                                    : 'border-slate-700 bg-slate-800 text-slate-300'
                                }`}
                              >
                                {statusLabel(user.adminStatus)}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-right">
                              {user.adminStatus === 'ACTIVE' ? (
                                <button
                                  type="button"
                                  disabled={isSelf}
                                  title={
                                    isSelf
                                      ? 'You cannot suspend your own account'
                                      : 'Suspend admin'
                                  }
                                  onClick={() =>
                                    setConfirmingAction({
                                      user,
                                      status: 'SUSPENDED',
                                    })
                                  }
                                  className="rounded-lg border border-rose-300/70 px-2.5 py-2 text-xs font-medium text-slate-100 transition hover:bg-rose-950/50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Suspend
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmingAction({
                                      user,
                                      status: 'ACTIVE',
                                    })
                                  }
                                  className="rounded-lg border border-emerald-700 px-2.5 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-950/50"
                                >
                                  Reactivate
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Responsive pagination */}
          <div className="flex flex-col gap-3 border-t border-slate-800 px-3 py-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <span>
              Showing{' '}
              {total === 0 ? 0 : (page - 1) * 10 + 1}
              –{Math.min(page * 10, total)} of {total}
            </span>

            <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-3">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() =>
                  setPage((value) => value - 1)
                }
                className="rounded-lg border border-slate-600 px-3 py-2.5 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="whitespace-nowrap">
                Page {page} of {pages}
              </span>

              <button
                type="button"
                disabled={page >= pages || loading}
                onClick={() =>
                  setPage((value) => value + 1)
                }
                className="rounded-lg border border-slate-600 px-3 py-2.5 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        {/* CREATE ADMIN MODAL */}
        {creating && (
          <div
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !submitting) {
                setCreating(false);
              }
            }}
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/80 p-3 pt-5 sm:items-center sm:p-4"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-admin-title"
              className="my-auto w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl sm:p-5"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2
                    id="create-admin-title"
                    className="text-lg font-semibold text-slate-100"
                  >
                    Create admin user
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Create a staff account and choose its access.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setCreating(false)}
                  aria-label="Close"
                  className="shrink-0 text-2xl leading-6 text-slate-400 hover:text-white disabled:opacity-40"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={createAdmin}
                className="space-y-4"
              >
                <label className="block text-sm font-medium text-slate-300">
                  Email

                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="colleague@skilho.com"
                    className={`${inputClass} mt-1.5`}
                  />
                </label>

                <label className="block text-sm font-medium text-slate-300">
                  Display name (optional)

                  <input
                    type="text"
                    maxLength={100}
                    autoComplete="name"
                    value={displayName}
                    onChange={(event) =>
                      setDisplayName(event.target.value)
                    }
                    placeholder="Enter full name"
                    className={`${inputClass} mt-1.5`}
                  />
                </label>

                <label className="block text-sm font-medium text-slate-300">
                  Temporary password

                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Minimum 8 characters"
                    className={`${inputClass} mt-1.5`}
                  />

                  <span className="mt-1 block text-xs text-slate-500">
                    Share it securely. The admin can change it later.
                  </span>
                </label>

                <label className="block text-sm font-medium text-slate-300">
                  Access

                  <select
                    value={access}
                    onChange={(event) =>
                      setAccess(
                        event.target.value as AdminAccess
                      )
                    }
                    className={`${inputClass} mt-1.5`}
                  >
                    {ACCESS.map((value) => (
                      <option key={value} value={value}>
                        {accessLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>

                {formError && (
                  <p
                    role="alert"
                    className="break-words rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300"
                  >
                    {formError}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-2 border-t border-slate-800 pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setCreating(false)}
                    className="w-full rounded-lg border border-slate-600 px-3.5 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-40 sm:w-auto"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-lg bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                  >
                    {submitting ? 'Creating...' : 'Create admin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUSPEND / REACTIVATE CONFIRMATION */}
        {confirmingAction && (
          <div
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !acting) {
                setConfirmingAction(null);
              }
            }}
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/80 p-3 pt-5 sm:items-center sm:p-4"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-action-title"
              className="my-auto w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl sm:p-5"
            >
              <h2
                id="confirm-action-title"
                className="text-lg font-semibold text-slate-100"
              >
                {confirmingAction.status === 'SUSPENDED'
                  ? 'Suspend admin'
                  : 'Reactivate admin'}
              </h2>

              <p className="mt-3 break-words text-sm leading-6 text-slate-300">
                {confirmingAction.status === 'SUSPENDED'
                  ? `Suspend ${confirmingAction.user.email}? They will be unable to sign in to the admin panel.`
                  : `Reactivate ${confirmingAction.user.email}? They will regain admin access.`}
              </p>

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => setConfirmingAction(null)}
                  className="w-full rounded-lg border border-slate-600 px-3.5 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-40 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={acting}
                  onClick={() => void confirmStatusChange()}
                  className={`w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto ${
                    confirmingAction.status === 'SUSPENDED'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {acting
                    ? 'Working...'
                    : confirmingAction.status === 'SUSPENDED'
                      ? 'Yes, suspend'
                      : 'Yes, reactivate'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
