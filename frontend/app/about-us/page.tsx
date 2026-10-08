import Link from 'next/link';

const professionalBenefits = [
  ['Profile', 'Create a professional profile that presents your experience and career goals.'],
  ['Skills', 'Showcase your technical skills, specializations, and hands-on experience.'],
  ['Job discovery', 'Search relevant roles by location, skills, experience, and job type.'],
  ['Applications', 'Apply for suitable openings and keep track of your applications.'],
  ['Career growth', 'Discover new opportunities to build your technical career.'],
];

const employerBenefits = [
  ['Company profile', 'Create an employer profile that introduces your business to candidates.'],
  ['Job openings', 'Post roles with the skills, experience, location, and job type you need.'],
  ['Candidate search', 'Search and filter skilled professionals to find relevant candidates.'],
  ['Candidate profiles', 'Review profiles and save suitable candidates for later.'],
  ['Hiring workflow', 'Manage applications, shortlist candidates, and move toward a hire.'],
];

const professions = [
  'Mobile Repair Technicians', 'Laptop & Computer Technicians', 'Electronics Technicians',
  'Appliance Repair Technicians', 'AC & Refrigerator Technicians', 'Electricians',
  'CCTV Technicians', 'Network & Hardware Technicians', 'Field Service Technicians',
  'Other skilled technical professionals',
];

const hiringBusinesses = ['Companies', 'Service businesses', 'Workshops', 'Repair centers', 'Field-service companies', 'Retailers', 'Other businesses hiring technicians'];

const reasons = [
  ['Skills-first hiring', 'Focus on practical skills and experience relevant to each role.'],
  ['Location-based opportunities', 'Help professionals find jobs in the places and areas they prefer.'],
  ['Relevant discovery', 'Make it easier for employers and professionals to find a suitable match.'],
  ['Clear profiles', 'Bring work history, skills, and role requirements into a more useful view.'],
  ['Simple workflow', 'Support job discovery, applications, candidate search, and hiring in one platform.'],
  ['Faster connection', 'Reduce friction between employers with open roles and skilled people ready to work.'],
];

const professionalSteps = ['Create your profile', 'Discover jobs', 'Apply', 'Get hired'];
const employerSteps = ['Create company profile', 'Post a job', 'Find candidates', 'Hire'];

function Arrow() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

function CheckIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>;
}

function FeatureList({ items }: { items: string[][] }) {
  return <ul className="about-benefit-list">{items.map(([title, text]) => <li key={title}><span className="about-check"><CheckIcon /></span><span><strong>{title}</strong><small>{text}</small></span></li>)}</ul>;
}

function ProcessSteps({ steps }: { steps: string[] }) {
  return <ol className="about-process-steps">{steps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong>{index < steps.length - 1 && <i aria-hidden="true">→</i>}</li>)}</ol>;
}

export default function AboutUsPage() {
  return (
    <main className="about-page">
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" aria-label="Skilho home"><img src="/skilho-logo.png" alt="Skilho" className="home-logo-img" /></Link>
          <nav className="main-nav">
            <Link href="/#jobs">Find jobs</Link><Link href="/#features">Why Skilho</Link><Link href="/#how">How it works</Link><Link href="/#employers">For employers</Link>
          </nav>
          <div className="header-actions"><Link href="/login/employee" className="login-link">Technician Login</Link><Link href="/login/employer" className="header-cta">Employer Login <Arrow /></Link></div>
        </div>
      </header>

      <section className="about-hero">
        <div className="about-shell about-hero-layout">
          <div className="about-hero-copy">
            <span className="about-eyebrow"><i /> Built for skilled work</span>
            <h1>A hiring platform for<br /><em>technical talent.</em></h1>
            <p>Skilho connects skilled technicians and professionals with companies looking for relevant technical talent. We make it simpler to discover opportunities, present skills, and manage hiring.</p>
            <div className="about-hero-actions"><Link href="/jobs" className="primary-btn">Explore jobs <Arrow /></Link><Link href="/login/employer" className="secondary-btn">Hire with Skilho</Link></div>
          </div>
          <div className="about-hero-visual" aria-label="Skilled professionals and employers connected through Skilho">
            <div className="about-visual-orbit orbit-large" /><div className="about-visual-orbit orbit-small" />
            <div className="about-visual-center"><span className="about-bolt">ϟ</span><strong>Skilho</strong><small>Skills meet opportunity</small></div>
            <div className="about-visual-label technician-label"><span>01</span><b>Skilled professionals</b></div>
            <div className="about-visual-label employer-label"><span>02</span><b>Hiring businesses</b></div>
          </div>
        </div>
      </section>

      <section className="about-mission-section">
        <div className="about-shell about-mission-layout">
          <div><span className="about-section-eyebrow">About Skilho</span><h2>Making skilled hiring simpler, faster, and more reliable.</h2></div>
          <div className="about-mission-copy"><p>Skilho is a hiring platform built specifically for skilled professionals and technicians. It brings their experience and capabilities closer to companies that need technical talent.</p><p>Our mission is to bridge the gap between skilled professionals and employers: help people discover relevant jobs, and help businesses find the right talent for the work they need done.</p></div>
        </div>
      </section>

      <section className="about-offers-section">
        <div className="about-shell">
          <div className="about-section-heading"><span className="about-section-eyebrow">One platform, two sides</span><h2>Tools for finding work and finding talent.</h2><p>Skilho supports the key steps professionals and employers take to connect around skilled technical work.</p></div>
          <div className="about-offers-grid">
            <article className="about-offer-card professional-offer"><div className="about-offer-heading"><span className="about-offer-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2M19 8a3 3 0 0 1 0 6M21 21v-2a5 5 0 0 0-3-4.6"/></svg></span><div><span>For professionals</span><h3>Build your next career move.</h3></div></div><FeatureList items={professionalBenefits} /><Link href="/login/employee" className="about-offer-link">Create a professional profile <Arrow /></Link></article>
            <article className="about-offer-card employer-offer"><div className="about-offer-heading"><span className="about-offer-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/></svg></span><div><span>For employers</span><h3>Find people ready for the work.</h3></div></div><FeatureList items={employerBenefits} /><Link href="/login/employer" className="about-offer-link">Create an employer profile <Arrow /></Link></article>
          </div>
        </div>
      </section>

      <section className="about-audience-section">
        <div className="about-shell about-audience-grid">
          <div className="about-audience-copy"><span className="about-section-eyebrow">Who Skilho is for</span><h2>Built around skilled technical professions.</h2><p>Skilho is focused on hands-on technical work across repair, service, maintenance, and support—not general job listings.</p><div className="about-audience-subhead">Professionals who can find opportunities here</div><div className="about-profession-chips">{professions.map((profession) => <span key={profession}>{profession}</span>)}</div></div>
          <div className="about-hiring-panel"><span className="about-section-eyebrow">Who can hire through Skilho</span><h3>Businesses that depend on skilled technicians.</h3><p>From a local workshop to a growing service operation, employers can use Skilho to describe the role and look for people with relevant skills.</p><div className="about-business-list">{hiringBusinesses.map((business) => <span key={business}><CheckIcon />{business}</span>)}</div></div>
        </div>
      </section>

      <section className="about-why-section">
        <div className="about-shell">
          <div className="about-section-heading"><span className="about-section-eyebrow">Why Skilho</span><h2>Relevant connections, with less friction.</h2><p>Designed to make skilled hiring clearer for both sides of the opportunity.</p></div>
          <div className="about-reasons-grid">{reasons.map(([title, text], index) => <article className="about-reason-card" key={title}><span>{String(index + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div>
      </section>

      <section className="about-how-section">
        <div className="about-shell">
          <div className="about-section-heading"><span className="about-section-eyebrow">How Skilho works</span><h2>Clear steps from profile to opportunity.</h2></div>
          <div className="about-process-grid"><article><h3>For professionals</h3><p>Put your skills in front of employers looking for technical talent.</p><ProcessSteps steps={professionalSteps} /></article><article><h3>For employers</h3><p>Describe the role, discover relevant candidates, and manage your hiring.</p><ProcessSteps steps={employerSteps} /></article></div>
        </div>
      </section>

      <section className="about-vision-section"><div className="about-shell about-vision-inner"><span className="about-section-eyebrow">Our vision</span><h2>A trusted place for skilled-professional hiring.</h2><p>We want to help skilled workers build better careers and help businesses find the right talent—through a platform that values practical skills, relevant opportunities, and clear connections.</p><Link href="/jobs" className="primary-btn">Find your next opportunity <Arrow /></Link></div></section>

      <footer className="about-footer"><div className="about-shell"><Link href="/" aria-label="Skilho home"><img src="/skilho-logo.png" alt="Skilho" /></Link><span>Connecting skilled people with the opportunities where they can do their best work.</span><Link href="/contact">Contact Skilho <Arrow /></Link></div></footer>
    </main>
  );
}
