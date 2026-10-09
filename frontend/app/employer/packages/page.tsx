'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, MotionConfig } from 'framer-motion';
import Icon from '../../components/Icon';

const API = 'http://localhost:3001';

type Pkg = { id: string; name: string; tier: string; priceRupees: number; durationDays: number; jobCredits: number; featuredJobs: boolean; advancedSearch: boolean; priorityListing: boolean };
type ActiveSub = { id: string; jobCreditsLeft: number; expiresAt: string; package: Pkg } | null;

const NAV = [
  ['/dashboard/employer', 'Dashboard', 'home'],
  ['/employer/jobs', 'Jobs', 'briefcase'],
  ['/employer/technicians', 'Candidates', 'user'],
  ['/employer/documents', 'Documents', 'clipboard'],
  ['/employer/profile', 'Company Profile', 'chart'],
  ['/employer/packages', 'Packages', 'trending'],
] as const;

function Logo() { return <img src="/skilho-logo.png" alt="Skilho" className="skilho-logo-img" />; }
function Side() { return <aside className="biz-sidebar package-side"><div className="biz-brand"><Link href="/"><Logo /></Link></div><div className="biz-company"><div className="biz-company-avatar">B</div><div><strong>Business workspace</strong><span>Employer account</span></div></div><nav className="biz-nav">{NAV.map(([href, label, icon]) => <Link key={href} href={href} className={href === '/employer/packages' ? 'active' : ''}><Icon name={icon as React.ComponentProps<typeof Icon>['name']} /><span>{label}</span>{href === '/employer/packages' && <i />}</Link>)}</nav><div className="biz-sidebar-bottom"><div className="biz-help-dot">?</div><div><strong>Need help?</strong><span>Contact Skilho support</span></div></div></aside>; }

export default function PackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [activeSub, setActiveSub] = useState<ActiveSub>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [checkoutPkg, setCheckoutPkg] = useState<Pkg | null>(null);

  const load = useCallback(async () => {
    const t = localStorage.getItem('skilho_token');
    if (!t) { router.replace('/login/employer'); return; }
    try {
      const headers = { Authorization: `Bearer ${t}` };
      const [pkgRes, subRes] = await Promise.all([fetch(`${API}/packages`), fetch(`${API}/employer/subscription`, { headers })]);
      if (subRes.status === 401 || subRes.status === 403) { localStorage.removeItem('skilho_token'); router.replace('/login/employer'); return; }
      if (!pkgRes.ok) throw new Error(`Could not load packages (error ${pkgRes.status})`);
      setPackages(await pkgRes.json());
      if (subRes.ok) { const text = await subRes.text(); setActiveSub(text ? JSON.parse(text) : null); }
      else setActiveSub(null);
      setLoadError('');
    } catch (e) { setLoadError(e instanceof TypeError ? 'Cannot reach the backend. Is it running on port 3000?' : e instanceof Error ? e.message : 'Something went wrong'); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function buyPackage(pkg: Pkg) {
    setCheckoutPkg(pkg);
  }

  async function confirmDemoPayment() {
    const pkg = checkoutPkg;
    if (!pkg) return;
    setError(''); setMessage(''); setBusy(true);
    try {
      const res = await fetch(`${API}/employer/packages/${pkg.id}/test-activate`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('skilho_token') ?? ''}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Could not activate package');
      setMessage(`Demo payment successful · ${pkg.name} package activated. No real money was charged.`); setCheckoutPkg(null); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not activate package'); }
    finally { setBusy(false); }
  }

  if (loading) return <main className="biz-loading"><div className="biz-spinner" /><span>Loading packages…</span></main>;
  if (loadError) return <main className="biz-loading"><div className="biz-error-box"><strong>Couldn’t load packages</strong><p>{loadError}</p><button onClick={load}>Try again</button></div></main>;

  return <MotionConfig reducedMotion="user"><div className="biz-app package-app"><Side /><main className="biz-main"><header className="biz-topbar"><div className="biz-breadcrumb"><span>Employer</span><b>/</b><strong>Packages</strong></div><div className="biz-top-actions"><Link href="/dashboard/employer" className="package-back">Back to dashboard</Link><button className="biz-icon-btn"><Icon name="bell" /></button></div></header><div className="packages-content">
    <motion.section className="packages-hero" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><div><span className="biz-eyebrow">GROW YOUR HIRING</span><h1>Choose a plan built for <em>better hiring.</em></h1><p>Post more roles, reach stronger candidates and give every job the visibility it deserves.</p></div><div className="package-orbit"><span /><i /><b>SK</b></div></motion.section>
    {activeSub && <motion.section className="current-plan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><div className="plan-icon">✓</div><div><span>Current plan</span><strong>{activeSub.package.name}</strong><p>{activeSub.jobCreditsLeft} job credits left · Expires {new Date(activeSub.expiresAt).toLocaleDateString()}</p></div><Link href="/employer/jobs">Use credits <Icon name="chevronRight" /></Link></motion.section>}
    {(error || message) && <div className={`biz-alert ${error ? 'error' : 'success'}`}>{error || message}</div>}
    <div className="pricing-heading"><div><span className="biz-eyebrow">SIMPLE PRICING</span><h2>Pick what your team needs.</h2></div><span>All plans include secure employer tools.</span></div>
    <section className={`pricing-grid count-${Math.min(packages.length, 3)}`}>{packages.map((pkg, i) => { const popular = i === Math.min(1, packages.length - 1); return <motion.article key={pkg.id} className={`price-card ${popular ? 'popular' : ''}`} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .08 }} whileHover={{ y: -7 }}>
      {popular && <span className="popular-ribbon">MOST POPULAR</span>}<div className="price-top"><span className="price-tier">{pkg.tier || (popular ? 'Growth' : 'Starter')}</span><h3>{pkg.name}</h3><p>For {pkg.durationDays} days</p></div><div className="price"><small>₹</small>{pkg.priceRupees.toLocaleString('en-IN')}<span>/ plan</span></div><div className="credit-pill"><strong>{pkg.jobCredits}</strong> job posting credits</div><ul><li><i>✓</i> {pkg.featuredJobs ? 'Featured job visibility' : 'Standard job visibility'}</li><li><i>✓</i> {pkg.advancedSearch ? 'Advanced candidate search' : 'Candidate discovery tools'}</li><li><i>✓</i> {pkg.priorityListing ? 'Priority listing & reach' : 'Standard listing'}</li><li><i>✓</i> Employer dashboard & analytics</li></ul><button className={popular ? 'price-btn primary' : 'price-btn'} disabled={busy} onClick={() => buyPackage(pkg)}>{busy ? 'Activating…' : 'Choose plan'} <Icon name="chevronRight" /></button></motion.article>; })}</section>
    <section className="pricing-trust"><div><strong>Designed for growing teams</strong><span>Upgrade when your hiring volume grows. Your dashboard stays the same.</span></div><div className="trust-points"><span>✓ Verified candidates</span><span>✓ Secure activation</span><span>✓ Clear credits</span></div></section>
    <p className="pricing-note">Demo checkout only: no real money is collected. Production payments require a provider integration and server-side payment verification.</p>
  </div></main>{checkoutPkg && <div className="sk-checkout-overlay" role="presentation"><section className="sk-checkout-modal" role="dialog" aria-modal="true" aria-labelledby="sk-checkout-title"><button type="button" className="sk-checkout-close" aria-label="Close checkout" onClick={() => setCheckoutPkg(null)}>×</button><div className="sk-checkout-mark">✓</div><span className="biz-eyebrow">SECURE DEMO CHECKOUT</span><h2 id="sk-checkout-title">Confirm your package</h2><p className="sk-checkout-description">You’re selecting <strong>{checkoutPkg.name}</strong> for {checkoutPkg.durationDays} days.</p><div className="sk-checkout-total"><span>Demo total</span><strong>₹{checkoutPkg.priceRupees.toLocaleString('en-IN')}</strong></div><div className="sk-checkout-warning"><strong>Test mode only</strong><span>This simulates a successful checkout. No card details are requested and no real payment is processed.</span></div><button type="button" className="price-btn primary sk-checkout-confirm" disabled={busy} onClick={confirmDemoPayment}>{busy ? 'Processing demo…' : 'Simulate successful payment'} <Icon name="chevronRight" /></button><button type="button" className="sk-checkout-cancel" onClick={() => setCheckoutPkg(null)} disabled={busy}>Cancel</button></section></div>} </div></MotionConfig>;
}
