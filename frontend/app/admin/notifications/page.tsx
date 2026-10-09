'use client';

import { useState } from 'react';
import AdminShell from '../components/AdminShell';
import { adminFetch } from '../components/adminApi';

const TYPES = ['SYSTEM', 'JOB', 'APPLICATION', 'VERIFICATION', 'MESSAGE'];

export default function AdminNotificationsPage() {
  const [mode, setMode] = useState<'broadcast' | 'user'>('broadcast');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('SYSTEM');
  const [audience, setAudience] = useState('ALL');
  const [userId, setUserId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(''); setSuccess(''); setBusy(true);
    try {
      const result = await adminFetch<{ recipients: number; audience: string }>(`/admin/manage/notifications/${mode === 'broadcast' ? 'broadcast' : 'user'}`, {
        method: 'POST',
        body: JSON.stringify({ title, body, type, ...(mode === 'broadcast' ? { audience } : { userId }) }),
      });
      setSuccess(mode === 'broadcast' ? `Notification sent to ${result.recipients} users (${result.audience}).` : 'Notification sent to the user.');
      setTitle(''); setBody(''); setUserId('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not send notification.'); }
    finally { setBusy(false); }
  }

  return <AdminShell>
    <div className="mx-auto max-w-2xl space-y-5">
      <div><h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Notifications</h1><p className="mt-1 text-sm text-slate-500">Send an in-app message to a group or one user.</p></div>
      <section className="surface overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">Send notification</h2><p className="mt-1 text-sm text-slate-500">Deliver in-app notifications to a role segment or one specific user.</p></div>
        <div className="flex gap-2 border-b border-slate-100 px-5 py-3">
          {(['broadcast', 'user'] as const).map((value) => <button key={value} type="button" onClick={() => { setMode(value); setError(''); setSuccess(''); }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === value ? 'bg-blue-600 text-white' : 'border border-slate-300 text-slate-600 hover:bg-slate-50'}`}>{value === 'broadcast' ? 'Broadcast' : 'Single user'}</button>)}
        </div>
        <form onSubmit={submit} className="space-y-4 p-5">
          {mode === 'broadcast' ? <Field label="Audience"><select value={audience} onChange={(e) => setAudience(e.target.value)} className={inputClass}><option value="ALL">Everyone</option><option value="EMPLOYERS">All employers</option><option value="TECHNICIANS">All technicians</option></select></Field> : <Field label="Target user ID"><input required value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User UUID" className={inputClass} /></Field>}
          <Field label="Type"><select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>{TYPES.map((value) => <option key={value}>{value}</option>)}</select></Field>
          <Field label="Title"><input required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Scheduled maintenance" className={inputClass} /></Field>
          <Field label="Body"><textarea required maxLength={2000} rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Notification message shown to users…" className={inputClass} /></Field>
          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          {success && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}
          <div className="flex justify-end border-t border-slate-200 pt-4"><button disabled={busy} className="btn-primary disabled:opacity-50">{busy ? 'Sending…' : mode === 'broadcast' ? 'Send broadcast' : 'Send to user'}</button></div>
        </form>
      </section>
    </div>
  </AdminShell>;
}

const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none';
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>{children}</label>; }
