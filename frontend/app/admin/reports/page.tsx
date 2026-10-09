'use client';

import { useEffect, useState } from 'react';
import AdminShell from '../components/AdminShell';
import { adminFetch } from '../components/adminApi';
import { nice } from '../components/ListPage';

type CountRow = { name: string; count: number };
type Report = {
  window: { from: string; to: string };
  users: { newUsers: number; newTechnicians: number; newEmployers: number; newAdmins: number; totalUsers: number; totalTechnicians: number; totalEmployers: number; totalAdmins: number };
  jobs: { newJobs: number; totalJobs: number; openJobs: number; closedJobs: number; byCategory: { category: string; count: number }[]; byLocation: { location: string; count: number }[] };
  applications: { newApplications: number; totalApplications: number; byStatus: { status: string; count: number }[] };
  verification: { awaitingReview: number; underReview: number; approved: number; rejected: number; suspended: number };
  revenue: { paymentsCount: number; total: number; allTimeTotal: number; failedCount: number; refundedCount: number; refundedTotal: number; currency: string; byPackage: { packageId: string; packageName: string; paymentsCount: number; total: number }[] };
};

type Section = 'all' | 'users' | 'jobs' | 'verification' | 'applications' | 'revenue';
const dateInputValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const today = () => dateInputValue(new Date());
const daysAgo = (days: number) => { const date = new Date(); date.setDate(date.getDate() - days); return dateInputValue(date); };
const money = (amount: number) => `INR ${amount.toLocaleString('en-IN')}`;

export default function AdminReportsPage() {
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(today());
  const [section, setSection] = useState<Section>('all');
  const [data, setData] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setBusy(true); setError('');
    adminFetch<Report>(`/admin/manage/reports?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then((report) => { if (active) setData(report); })
      .catch((e: Error) => { if (active) setError(e.message); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [from, to]);

  function exportCsv() {
    if (!data) return;
    const rows: (string | number)[][] = [['Report', 'Metric', 'Value']];
    const add = (group: string, metric: string, value: string | number) => rows.push([group, metric, value]);
    Object.entries(data.users).forEach(([key, value]) => add('Users', nice(key), value));
    Object.entries(data.jobs).filter(([, value]) => typeof value === 'number').forEach(([key, value]) => add('Jobs', nice(key), value as number));
    data.jobs.byCategory.forEach((row) => add('Jobs by category', row.category, row.count));
    data.jobs.byLocation.forEach((row) => add('Jobs by location', row.location, row.count));
    Object.entries(data.verification).forEach(([key, value]) => add('Company verification', nice(key), value));
    add('Applications', 'New applications', data.applications.newApplications);
    add('Applications', 'Total applications', data.applications.totalApplications);
    data.applications.byStatus.forEach((row) => add('Applications by status', nice(row.status), row.count));
    Object.entries(data.revenue).filter(([, value]) => typeof value === 'number').forEach(([key, value]) => add('Revenue', nice(key), value as number));
    data.revenue.byPackage.forEach((row) => add('Revenue by package', row.packageName, row.total));
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `skilho-${section}-report-${from}-to-${to}.csv`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const label = data ? `${new Date(data.window.from).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} - ${new Date(data.window.to).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : '';
  const show = (value: Section) => section === 'all' || section === value;

  return <AdminShell>
    <div className="mx-auto max-w-7xl space-y-5">
      <header><h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Reports</h1><p className="mt-1 text-sm text-slate-500">Review activity and revenue across Skilho.</p></header>

      <div className="surface flex flex-wrap items-end gap-3 rounded-xl p-3 sm:flex-nowrap">
        <DateField label="From" value={from} max={to} onChange={setFrom} />
        <DateField label="To" value={to} min={from} max={today()} onChange={setTo} />
        <label className="block min-w-52 flex-1"><span className="mb-1 block text-xs text-slate-500">Report data</span><select value={section} onChange={(e) => setSection(e.target.value as Section)} className={input}><option value="all">All report data</option><option value="users">Users</option><option value="jobs">Jobs</option><option value="applications">Applications</option><option value="verification">Company verification</option><option value="revenue">Revenue</option></select></label>
        <button type="button" onClick={exportCsv} disabled={!data || busy} className="btn-primary min-w-28 disabled:opacity-50">Download CSV</button>
      </div>

      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {data && <>
        {show('all') || show('users') || show('jobs') || show('applications') || show('revenue') ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {show('all') || show('users') ? <Metric title="New users" value={data.users.newUsers} subtitle={label} tone="sky" /> : null}
          {show('all') || show('jobs') ? <Metric title="New jobs" value={data.jobs.newJobs} subtitle={label} tone="violet" /> : null}
          {show('all') || show('applications') ? <Metric title="New applications" value={data.applications.newApplications} subtitle={label} tone="rose" /> : null}
          {show('all') || show('revenue') ? <Metric title="Revenue in window" value={money(data.revenue.total)} subtitle={`${data.revenue.paymentsCount} paid payments`} tone="emerald" /> : null}
        </div> : null}

        <div className="grid gap-4 xl:grid-cols-2">
          {show('all') || show('users') ? <Panel title="Users" subtitle={label}>
            <Rows rows={[
              ['New users in selected period', data.users.newUsers], ['New technicians in selected period', data.users.newTechnicians], ['New employers in selected period', data.users.newEmployers], ['New admins in selected period', data.users.newAdmins],
              ['Total users on platform', data.users.totalUsers], ['— of which technicians', data.users.totalTechnicians], ['— of which employers', data.users.totalEmployers], ['— of which admins', data.users.totalAdmins],
            ]} />
          </Panel> : null}

          {show('all') || show('jobs') ? <Panel title="Jobs" subtitle={label}>
            <Rows rows={ [['New jobs in selected period', data.jobs.newJobs], ['Total jobs on platform', data.jobs.totalJobs], ['Open jobs', data.jobs.openJobs], ['Closed jobs', data.jobs.closedJobs] ]} />
            <Bars title="Jobs by category (all time)" rows={data.jobs.byCategory.map((r) => ({ name: nice(r.category), count: r.count }))} />
            <Bars title="Top locations (all time)" rows={data.jobs.byLocation.map((r) => ({ name: r.location, count: r.count }))} />
          </Panel> : null}

          {show('all') || show('verification') ? <Panel title="Company verification" subtitle="Current status of all verifications"><Rows rows={[
            ['Awaiting review', data.verification.awaitingReview], ['Under review', data.verification.underReview], ['Approved', data.verification.approved], ['Rejected', data.verification.rejected], ['Suspended', data.verification.suspended],
          ]} /></Panel> : null}

          {show('all') || show('applications') ? <Panel title="Applications by status" subtitle="Within selected date range">
            <Bars rows={data.applications.byStatus.map((r) => ({ name: nice(r.status), count: r.count }))} />
            <div className="mt-4 border-t border-slate-200 pt-3"><Rows rows={ [['New applications in selected period', data.applications.newApplications], ['Total applications on platform', data.applications.totalApplications] ]} /></div>
          </Panel> : null}

          {show('all') || show('revenue') ? <Panel title="Revenue" subtitle="From verified (PAID) payments only">
            <Rows rows={[
              ['Paid payments in selected period', data.revenue.paymentsCount], ['Revenue in selected period', money(data.revenue.total)], ['All-time verified revenue', money(data.revenue.allTimeTotal)],
              ['Failed payments in selected period', data.revenue.failedCount], ['Refunded payments in selected period', data.revenue.refundedCount], ['Refunded amount in selected period', money(data.revenue.refundedTotal)],
            ]} />
            {data.revenue.byPackage.length ? <Bars title="Revenue by package (selected period)" rows={data.revenue.byPackage.map((r) => ({ name: `${r.packageName} · ${r.paymentsCount} payments · ${money(r.total)}`, count: r.total }))} /> : null}
          </Panel> : null}
        </div>
      </>}
      {!data && !error ? <div className="surface rounded-xl p-8 text-center text-sm text-slate-500">Loading report…</div> : null}
    </div>
  </AdminShell>;
}

const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none';
function DateField({ label, value, min, max, onChange }: { label: string; value: string; min?: string; max?: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-1 block text-xs text-slate-500">{label}</span><input type="date" value={value} min={min} max={max} onChange={(e) => onChange(e.target.value)} className={input} /></label>;
}
function Metric({ title, value, subtitle, tone }: { title: string; value: string | number; subtitle: string; tone: string }) {
  const iconColors: Record<string, string> = { sky: 'bg-sky-500/10 text-sky-500', violet: 'bg-violet-500/10 text-violet-500', rose: 'bg-rose-500/10 text-rose-500', emerald: 'bg-emerald-500/10 text-emerald-500' };
  return <section className="surface flex min-h-24 items-center justify-between rounded-xl p-4"><div><p className="text-xs text-slate-500">{title}</p><p className="mt-1 text-xl font-bold text-slate-900">{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</p><p className="mt-1 text-[10px] text-slate-400">{subtitle}</p></div><span className={`rounded-lg p-2 ${iconColors[tone]}`}>▥</span></section>;
}
function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="surface overflow-hidden rounded-xl"><header className="border-b border-slate-200 px-4 py-3"><h2 className="text-sm font-semibold text-slate-900">{title}</h2><p className="mt-0.5 text-[10px] text-slate-500">{subtitle}</p></header><div className="space-y-4 p-4">{children}</div></section>;
}
function Rows({ rows }: { rows: [string, string | number][] }) {
  return <dl className="space-y-2.5 text-xs">{rows.map(([label, value], i) => <div key={label} className={`flex items-center justify-between gap-3 ${i === 4 ? 'mt-3 border-t border-slate-200 pt-3' : ''}`}><dt className="text-slate-500">{label}</dt><dd className="font-semibold tabular-nums text-slate-900">{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</dd></div>)}</dl>;
}
function Bars({ title, rows }: { title?: string; rows: CountRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return <div>{title ? <h3 className="mb-2 mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{title}</h3> : null}<ul className="space-y-2">{rows.map((r) => <li key={r.name}><div className="mb-1 flex justify-between gap-3 text-[10px]"><span className="truncate text-slate-500">{r.name}</span><span className="font-semibold text-slate-900">{r.count.toLocaleString('en-IN')}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-600" style={{ width: `${r.count / max * 100}%` }} /></div></li>)}</ul></div>;
}
