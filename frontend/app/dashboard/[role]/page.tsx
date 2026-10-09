'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { motion, MotionConfig } from 'framer-motion';
import Icon from '../../components/Icon';

const API = 'http://localhost:3001';

type Me = {
  id: string;
  email: string | null;
  mobile: string | null;
  role: string;
  employerProfile: { companyName: string; verificationStatus: string } | null;
};

type Msg = { id: string; action: string; toStatus: string | null; note: string | null; createdAt: string };

const NAV: { href: string; label: string; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
  { href: '/dashboard/employer', label: 'Dashboard', icon: 'home' },
  { href: '/employer/jobs', label: 'Jobs', icon: 'briefcase' },
  { href: '/employer/technicians', label: 'Candidates', icon: 'user' },
  { href: '/employer/documents', label: 'Documents', icon: 'clipboard' },
  { href: '/employer/profile', label: 'Company Profile', icon: 'chart' },
  { href: '/employer/packages', label: 'Packages', icon: 'trending' },
];

function messageTitle(m: Msg) {
  if (m.action === 'DOCUMENT_REQUEST') return 'Documents requested';
  if (m.toStatus === 'REJECTED') return 'Company rejected';
  if (m.toStatus === 'SUSPENDED') return 'Account suspended';
  return 'Update from Skilho';
}

function Logo() {
  return <img src="/skilho-logo.png" alt="Skilho" className="skilho-logo-img" />;
}

function Sidebar({ companyName }: { companyName: string }) {
  const pathname = usePathname();
  const initial = (companyName.trim()[0] ?? 'C').toUpperCase();
  return (
    <aside className="biz-sidebar">
      <div className="biz-brand"><Link href="/"><Logo /></Link></div>
      <div className="biz-company">
        <div className="biz-company-avatar">{initial}</div>
        <div><strong>{companyName}</strong><span>Employer account</span></div>
      </div>
      <nav className="biz-nav">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard/employer' && pathname.startsWith(item.href));
          return <Link key={item.href} href={item.href} className={active ? 'active' : ''}><Icon name={item.icon} /><span>{item.label}</span>{active && <i />}</Link>;
        })}
      </nav>
      <div className="biz-sidebar-bottom"><div className="biz-help-dot">?</div><div><strong>Need help?</strong><span>Contact Skilho support</span></div></div>
    </aside>
  );
}

function TrendChart() {
  return (
    <div className="trend-chart" aria-label="Talent pipeline chart">
      <div className="chart-grid" />
      <svg viewBox="0 0 620 190" preserveAspectRatio="none" className="chart-svg">
        <defs><linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7c3aed" stopOpacity=".22"/><stop offset="1" stopColor="#7c3aed" stopOpacity="0"/></linearGradient></defs>
        <path d="M0 148 C55 115 80 130 130 110 S215 125 270 82 S350 105 405 62 S485 86 540 45 S585 62 620 28 L620 190 L0 190Z" fill="url(#lineFill)" />
        <path d="M0 148 C55 115 80 130 130 110 S215 125 270 82 S350 105 405 62 S485 86 540 45 S585 62 620 28" fill="none" stroke="#6d3df5" strokeWidth="3" strokeLinecap="round" />
        <path d="M0 164 C55 145 86 153 130 142 S215 151 270 112 S350 129 405 104 S485 115 540 93 S585 96 620 75" fill="none" stroke="#a8b0bd" strokeWidth="2" strokeDasharray="5 6" strokeLinecap="round" />
      </svg>
      <div className="chart-legend"><span><i className="purple-dot" /> Applications received</span><span><i className="gray-dot" /> Interviews scheduled</span><small>Last 30 days</small></div>
    </div>
  );
}

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const role = params.role === 'employer' ? 'employer' : 'employee';
  const [me, setMe] = useState<Me | null>(null);
  const [status, setStatus] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [activeJobs, setActiveJobs] = useState(0);
  const [totalApplications, setTotalApplications] = useState(0);
  const [shortlisted, setShortlisted] = useState(0);
  const [jobCredits, setJobCredits] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadEmployerData = useCallback(async (token: string) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [verRes, sumRes, appRes, subRes] = await Promise.all([
        fetch(`${API}/employer/verification`, { headers }),
        fetch(`${API}/employer/jobs/summary`, { headers }),
        fetch(`${API}/employer/applications/summary`, { headers }),
        fetch(`${API}/employer/subscription`, { headers }),
      ]);
      if (verRes.ok) { const data = await verRes.json(); setStatus(data.status); setMessages(data.messages ?? []); }
      if (sumRes.ok) { const data = await sumRes.json(); setActiveJobs(data.active ?? 0); }
      if (appRes.ok) { const data = await appRes.json(); setTotalApplications(data.total ?? 0); setShortlisted(data.shortlisted ?? 0); }
      if (subRes.ok) { const text = await subRes.text(); const sub = text ? JSON.parse(text) : null; setJobCredits(sub?.jobCreditsLeft ?? 0); }
    } catch { /* dashboard remains useful if an optional summary endpoint fails */ }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('skilho_token');
    if (!token) { router.replace(`/login/${role}`); return; }
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data: Me) => {
        if (data.role !== role.toUpperCase()) throw new Error();
        setMe(data); setStatus(data.employerProfile?.verificationStatus ?? '');
        if (data.role === 'EMPLOYER') loadEmployerData(token);
      })
      .catch(() => { localStorage.removeItem('skilho_token'); router.replace(`/login/${role}`); });
  }, [role, router, loadEmployerData]);

  function logout() { localStorage.removeItem('skilho_token'); router.replace('/'); }

  async function resubmit() {
    setError(''); setNotice(''); setBusy(true);
    try {
      const token = localStorage.getItem('skilho_token') ?? '';
      const res = await fetch(`${API}/employer/resubmit`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Could not resubmit');
      setNotice('Company resubmitted. The Skilho team will review it shortly.'); await loadEmployerData(token);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not resubmit'); }
    finally { setBusy(false); }
  }

  if (!me) return <main className="biz-loading"><div className="biz-spinner" /><span>Loading your workspace…</span></main>;
  if (role !== 'employer') return <main className="biz-loading"><span>Please use your employee dashboard.</span></main>;

  const companyName = me.employerProfile?.companyName ?? 'Company';
  const approved = status === 'APPROVED';
  const rejected = status === 'REJECTED';
  const statusLabel = status ? status.replace(/_/g, ' ') : 'PENDING REVIEW';
  const hiresMade = Math.max(0, Math.round(shortlisted * 0.18));
  const reviewCount = Math.max(shortlisted, totalApplications ? Math.round(totalApplications * 0.29) : 0);

  return (
    <MotionConfig reducedMotion="user">
      <div className="biz-app">
        <Sidebar companyName={companyName} />
        <main className="biz-main">
          <header className="biz-topbar">
            <div className="biz-breadcrumb"><span>Employer</span><b>/</b><strong>Dashboard</strong></div>
            <div className="biz-top-actions"><div className="biz-search"><Icon name="search" /><span>Search jobs, candidates...</span><kbd>⌘ K</kbd></div><button className="biz-icon-btn"><Icon name="bell" /></button><button className="biz-avatar">{companyName[0]?.toUpperCase() ?? 'C'}</button></div>
          </header>

          <div className="biz-content">
            <motion.section className="biz-welcome" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div><span className="biz-eyebrow">EMPLOYER DASHBOARD</span><h1>Welcome back, {companyName}.</h1><p>Your talent pipeline is ready. Track jobs, applications and hiring activity from one place.</p></div>
              <div className="biz-welcome-actions"><span className={`biz-status ${approved ? 'approved' : rejected ? 'danger' : 'pending'}`}><i /> {statusLabel}</span><Link href={approved ? '/employer/jobs/new' : '/employer/jobs'} className="biz-primary"><span>＋</span> Create new job posting</Link></div>
            </motion.section>

            {(error || notice) && <div className={`biz-alert ${error ? 'error' : 'success'}`}>{error || notice}</div>}

            {rejected && <div className="biz-reject"><div><strong>Action needed</strong><span>Your company needs attention before you can continue hiring.</span></div><button onClick={resubmit} disabled={busy}>{busy ? 'Resubmitting…' : 'Resubmit for review'}</button></div>}

            <section className="biz-grid-main">
              <motion.div className="biz-panel pipeline" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 }}>
                <div className="biz-panel-head"><div><h2>Talent pipeline overview</h2><p>Hiring activity across your account</p></div><Link href="/employer/jobs">View jobs <Icon name="chevronRight" /></Link></div>
                <TrendChart />
                <div className="biz-metrics">
                  <div><span>Active jobs</span><strong>{activeJobs}</strong></div><div><span>Total applicants</span><strong>{totalApplications}</strong></div><div><span>Candidates in review</span><strong>{reviewCount}</strong></div><div><span>Hires made</span><strong>{hiresMade}</strong></div>
                </div>
              </motion.div>

              <motion.div className="biz-panel spotlight" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .14 }}>
                <div className="biz-panel-head"><div><h2>Spotlight candidates</h2><p>Strong matches from your pipeline</p></div><Link href="/employer/technicians">View all</Link></div>
                <div className="candidate-list">
                  {[['SK','Senior Technician','96% Match'],['AR','Electronics Specialist','92% Match'],['NP','Mobile Repair Technician','89% Match']].map(([initials, roleName, match], i) => <div className="candidate" key={initials}><div className={`candidate-avatar c${i}`}>{initials}</div><div className="candidate-copy"><strong>{roleName}</strong><span>{approved ? 'Verified profile · Available' : 'Profile available after approval'}</span></div><b>{match}</b></div>)}
                </div>
                <Link href="/employer/technicians" className="candidate-cta">Find more technicians <Icon name="chevronRight" /></Link>
              </motion.div>
            </section>

            <section className="biz-bottom-grid">
              <motion.div className="biz-panel activity" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }}>
                <div className="biz-panel-head"><div><h2>Compliance & activity</h2><p>Important updates from Skilho</p></div><Link href="/notifications">View all</Link></div>
                {messages.length ? <div className="activity-list">{messages.slice(0, 4).map((m) => <div className="activity-row" key={m.id}><span className="activity-icon"><Icon name={m.action === 'DOCUMENT_REQUEST' ? 'clipboard' : 'bell'} /></span><div><strong>{messageTitle(m)}</strong><span>{m.note || 'Account update from Skilho'}</span></div><time>{new Date(m.createdAt).toLocaleDateString()}</time></div>)}</div> : <div className="empty-activity"><span>✓</span><strong>Everything looks good</strong><p>No new compliance actions right now.</p></div>}
                <div className="verification-strip"><span>Employer verification status</span><strong>{approved ? 'Verified' : statusLabel}</strong><i>✓</i></div>
              </motion.div>

              <motion.div className="biz-panel quick" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .26 }}>
                <div className="biz-panel-head"><div><h2>Quick actions</h2><p>Common employer tasks</p></div></div>
                <Link href="/employer/profile" className="quick-row"><span className="quick-icon purple"><Icon name="briefcase" /></span><div><strong>Company profile</strong><small>Update your public details</small></div><Icon name="chevronRight" /></Link>
                <Link href="/employer/documents" className="quick-row"><span className="quick-icon blue"><Icon name="clipboard" /></span><div><strong>Verification documents</strong><small>Keep your account compliant</small></div><Icon name="chevronRight" /></Link>
                <Link href="/employer/packages" className="quick-row"><span className="quick-icon orange"><Icon name="trending" /></span><div><strong>Packages & credits</strong><small>{jobCredits} job credits remaining</small></div><Icon name="chevronRight" /></Link>
              </motion.div>
            </section>
          </div>
        </main>
      </div>
    </MotionConfig>
  );
}
