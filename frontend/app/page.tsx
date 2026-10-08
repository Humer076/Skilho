import Link from 'next/link';
import { LandingJobPreview, LandingJobsShowcase } from './components/LandingJobs';

function Icon({ children, size = 20 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const stats = [
  {
    value: '12K+',
    label: 'Skilled professionals',
    detail: 'Technicians and skilled workers building their careers.',
    tone: 'blue',
    icon: <Icon><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></Icon>,
  },
  {
    value: '1,800+',
    label: 'Active opportunities',
    detail: 'Roles listed for skilled professionals.',
    tone: 'purple',
    icon: <Icon><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></Icon>,
  },
  {
    value: '650+',
    label: 'Hiring companies',
    detail: 'Employers looking for skilled talent.',
    tone: 'green',
    icon: <Icon><rect x="3" y="7" width="7" height="14" rx="1" /><rect x="14" y="3" width="7" height="18" rx="1" /><path d="M6 10h1M6 13h1M6 16h1M17 7h1M17 10h1M17 13h1M17 16h1" /></Icon>,
  },
  {
    value: '92%',
    label: 'Successful matches',
    detail: 'Professionals finding the right opportunity.',
    tone: 'orange',
    icon: <Icon><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></Icon>,
  },
];

const features = [
  {
    no: '01',
    title: 'Smart matching',
    text: 'Discover opportunities that fit your skills, experience, location and career goals instead of scrolling through irrelevant listings.',
    icon: <Icon><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" /></Icon>,
  },
  {
    no: '02',
    title: 'Verified employers',
    text: 'Apply with confidence. Company profiles and hiring activity are reviewed to keep opportunities genuine and professional.',
    icon: <Icon><path d="M12 3l7 3v5c0 4.7-2.9 8.2-7 10-4.1-1.8-7-5.3-7-10V6l7-3z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></Icon>,
  },
  {
    no: '03',
    title: 'One clear profile',
    text: 'Show your skills, experience and achievements once. Let employers understand what you can do before the first call.',
    icon: <Icon><circle cx="12" cy="8" r="3.2" /><path d="M5 20c.7-3.6 3.1-5.5 7-5.5s6.3 1.9 7 5.5" /><path d="M17 11.5h4M19 9.5v4" /></Icon>,
  },
];

function Logo() {
  return <img src="/skilho-logo.png" alt="Skilho" className="home-logo-img" />;
}

function HeroWorld() {
  return (
    <div className="hero-world" aria-hidden="true">
      <div className="world-glow" />
      <svg className="world-globe" viewBox="0 0 520 520" fill="none">
        <defs>
          <radialGradient id="globeFill" cx="38%" cy="30%">
            <stop offset="0" stopColor="#d9ccff" stopOpacity=".95" />
            <stop offset=".55" stopColor="#9c7bff" stopOpacity=".68" />
            <stop offset="1" stopColor="#5b2bd8" stopOpacity=".92" />
          </radialGradient>
          <filter id="globeShadow"><feDropShadow dx="0" dy="22" stdDeviation="22" floodColor="#6d3df5" floodOpacity=".22" /></filter>
        </defs>
        <circle cx="260" cy="260" r="184" fill="url(#globeFill)" filter="url(#globeShadow)" />
        <ellipse cx="260" cy="260" rx="184" ry="78" stroke="#fff" strokeOpacity=".28" strokeWidth="2" />
        <ellipse cx="260" cy="260" rx="184" ry="126" stroke="#fff" strokeOpacity=".2" strokeWidth="2" />
        <ellipse cx="260" cy="260" rx="72" ry="184" stroke="#fff" strokeOpacity=".22" strokeWidth="2" />
        <ellipse cx="260" cy="260" rx="128" ry="184" stroke="#fff" strokeOpacity=".18" strokeWidth="2" />
        <path d="M93 260h334M119 184c89 42 193 42 282 0M119 336c89-42 193-42 282 0" stroke="#fff" strokeOpacity=".2" strokeWidth="2" />
        <circle cx="145" cy="178" r="8" fill="#fff" fillOpacity=".8" />
        <circle cx="362" cy="313" r="6" fill="#fff" fillOpacity=".65" />
      </svg>
      <svg className="hero-human" viewBox="0 0 180 360" fill="none">
        <defs><linearGradient id="humanGrad" x1="70" y1="0" x2="115" y2="360"><stop stopColor="#262039"/><stop offset="1" stopColor="#0c0a16"/></linearGradient></defs>
        <circle cx="91" cy="43" r="27" fill="url(#humanGrad)" />
        <path d="M58 88c10-19 27-28 33-28s24 9 34 28l18 75-31 9-9-45v81l30 116h-29l-16-91-15 91H44l28-116V127l-9 45-31-9 26-75Z" fill="url(#humanGrad)" />
        <path d="M58 100c10 9 23 14 33 14 12 0 24-5 34-14" stroke="#fff" strokeOpacity=".13" strokeWidth="4" strokeLinecap="round" />
        <path d="M42 334h48M91 334h47" stroke="#0c0a16" strokeWidth="12" strokeLinecap="round" />
      </svg>
      <span className="world-chip chip-one">12K+ professionals</span>
      <span className="world-chip chip-two">92% match rate</span>
    </div>
  );
}

export default function Home() {
  return (
    <main className="home">
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" aria-label="Skilho home"><Logo /></Link>
          <nav className="main-nav">
            <Link href="#jobs">Find jobs</Link>
            <Link href="#features">Why Skilho</Link>
            <Link href="#how">How it works</Link>
            <Link href="#employers">For employers</Link>
          </nav>
          <div className="header-actions">
            <Link href="/login/employee" className="login-link">Technician Login</Link>
            <Link href="/login/employer" className="header-cta">Employer Login <Icon size={16}><path d="M5 12h14M13 6l6 6-6 6" /></Icon></Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-glow glow-one" />
        <div className="hero-glow glow-two" />
        <div className="hero-content">
          <div className="hero-copy">
            <div className="eyebrow"><span className="pulse-dot" /> The smarter way to get hired</div>
            <h1>Great talent.<br /><em>Right opportunity.</em><br />One simple platform.</h1>
            <p className="hero-lead">
              Skilho connects skilled professionals with verified employers through intelligent matching, clear profiles and a hiring experience built for speed.
            </p>
            <div className="hero-buttons">
              <Link href="/login/employee" className="primary-btn">Find your next job <Icon size={18}><path d="M5 12h14M13 6l6 6-6 6" /></Icon></Link>
              <Link href="/login/employer" className="secondary-btn">I&apos;m hiring</Link>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack"><i>RK</i><i>AS</i><i>PM</i><i>+</i></div>
              <div><strong>12,000+</strong><span>professionals already building their careers</span></div>
            </div>
          </div>

          <div className="hero-visual">
            <HeroWorld />
            <div className="orbit orbit-a" />
            <div className="orbit orbit-b" />
            <div className="visual-label label-top"><span className="mini-dot" /> Live opportunities</div>
            <LandingJobPreview />
            <div className="floating-card match-float">
              <div className="float-icon"><Icon size={18}><path d="M20 7 10 17l-5-5" /></Icon></div>
              <div><strong>Perfect match</strong><span>Your skills fit this role</span></div>
            </div>
            <div className="floating-card hired-float">
              <div className="float-avatar">✓</div>
              <div><strong>Application viewed</strong><span>2 min ago · Apex Devices</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="section-shell impact-shell">
          <div className="impact-intro">
            <span className="impact-kicker"><Icon size={16}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></Icon> Trusted by professionals</span>
            <h2>Building better careers for <em>skilled professionals</em></h2>
            <p>Join technicians finding great opportunities with top companies.</p>
          </div>
          <div className="impact-cards">
            {stats.map((stat) => (
              <article className={`impact-stat impact-${stat.tone}`} key={stat.label}>
                <div className="impact-icon">{stat.icon}</div>
                <div className="impact-stat-copy">
                  <strong>{stat.value}</strong>
                  <h3>{stat.label}</h3>
                  <p>{stat.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="jobs" className="jobs-section">
        <div className="jobs-landing-shell">
          <div className="jobs-discovery-head">
            <span className="jobs-discovery-kicker"><Icon size={16}><path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" /><path d="m8 12 2.5 2.5L16 9" /></Icon> EXPLORE OPPORTUNITIES</span>
            <h2>Find work that<br /><em>fits your future.</em></h2>
            <p>Explore verified opportunities from trusted companies and start your next career move with Skilho.</p>
          </div>
          <LandingJobsShowcase />
        </div>
      </section>

      <section id="features" className="feature-section">
        <div className="section-shell">
          <div className="section-heading centered"><span className="section-kicker">BUILT AROUND PEOPLE</span><h2>A better hiring experience,<br /><em>from first click to first day.</em></h2><p>Less noise. More clarity. Better connections between people and the companies they want to grow with.</p></div>
          <div className="feature-grid">
            {features.map((f) => <article className="feature-card" key={f.no}><span className="feature-no">{f.no}</span><div className="feature-icon">{f.icon}</div><h3>{f.title}</h3><p>{f.text}</p><Link href="/coming-soon">Learn more <Icon size={15}><path d="M5 12h14M13 6l6 6-6 6" /></Icon></Link></article>)}
          </div>
        </div>
      </section>

      <section id="how" className="how-section section-shell">
        <div className="how-visual">
          <div className="phone-glow" />
          <div className="phone">
            <div className="phone-notch" />
            <div className="phone-header"><span>9:41</span><span>● ● ▮</span></div>
            <div className="phone-welcome"><span>Good morning, Aarav</span><strong>Find your next role.</strong></div>
            <div className="phone-search"><Icon size={15}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></Icon> Search jobs</div>
            <div className="phone-label">Recommended for you</div>
            <div className="phone-job"><div className="phone-logo">AD</div><div><strong>Senior Mobile Technician</strong><small>Apex Devices · Bengaluru</small><b>₹45K–₹60K</b></div><span>94%</span></div>
            <div className="phone-job"><div className="phone-logo purple">TL</div><div><strong>Laptop Repair Specialist</strong><small>TechCare · Hyderabad</small><b>₹32K–₹48K</b></div><span>89%</span></div>
            <div className="phone-nav"><span>⌂<small>Home</small></span><span>⌕<small>Search</small></span><span>♡<small>Saved</small></span><span>◉<small>Profile</small></span></div>
          </div>
        </div>
        <div className="how-copy"><span className="section-kicker">HOW IT WORKS</span><h2>From profile<br />to <em>payday.</em></h2><p>Everything you need to move your career forward, without the friction of traditional job hunting.</p>
          <ol className="steps">
            <li><span>01</span><div><h3>Create your profile</h3><p>Tell employers what you know, what you&apos;ve done and where you want to go.</p></div></li>
            <li><span>02</span><div><h3>Discover the right roles</h3><p>Get relevant opportunities surfaced around your skills and preferences.</p></div></li>
            <li><span>03</span><div><h3>Apply and get noticed</h3><p>Track applications, hear back faster and move confidently through the process.</p></div></li>
          </ol>
          <Link href="/login/employee" className="primary-btn">Build your profile <Icon size={18}><path d="M5 12h14M13 6l6 6-6 6" /></Icon></Link>
        </div>
      </section>

      <section id="employers" className="employer-section">
        <div className="section-shell employer-inner">
          <div><span className="section-kicker light">FOR EMPLOYERS</span><h2>Meet the people<br /><em>who move work forward.</em></h2><p>Stop sorting through hundreds of applications. Build a stronger pipeline with verified profiles and skill-first matching.</p><div className="employer-actions"><Link href="/login/employer" className="light-btn">Start hiring <Icon size={17}><path d="M5 12h14M13 6l6 6-6 6" /></Icon></Link><Link href="/contact" className="light-link">Talk to our team</Link></div></div>
          <div className="employer-panel"><div className="panel-top"><span>Hiring dashboard</span><span className="live"><i /> Live</span></div><div className="panel-stat"><span>Active candidates</span><strong>2,486</strong><small>+18.4% this month</small></div><div className="candidate-row"><i>RS</i><div><strong>Rahul Sharma</strong><span>Mobile Technician · 5 yrs</span></div><b>96%</b></div><div className="candidate-row"><i>NK</i><div><strong>Neha Kumar</strong><span>Electronics Specialist · 4 yrs</span></div><b>92%</b></div><div className="candidate-row"><i>AM</i><div><strong>Arjun Menon</strong><span>Laptop Technician · 3 yrs</span></div><b>89%</b></div></div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="section-shell footer-grid">
          <div className="footer-brand"><Link href="/" className="footer-logo" aria-label="Skilho home"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="17" cy="2.5" r="2.4" fill="currentColor" /><path d="M14 5 5 13h7l-1 9 9-12h-7l1-5Z" fill="currentColor" /></svg><span>Skilho</span></Link><p>Connecting skilled people with the opportunities where they can do their best work.</p><div className="socials"><span>in</span><span>𝕏</span><span>◎</span></div></div>
          <div><h4>Platform</h4><Link href="#jobs">Find jobs</Link><Link href="/login/employee">For professionals</Link><Link href="/login/employer">For employers</Link><Link href="/coming-soon">Mobile app</Link></div>
          <div><h4>Company</h4><Link href="/about-us">About us</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
          <div><h4>Get started</h4><Link href="/login/employee">Create profile</Link><Link href="/login/employer">Post a job</Link><Link href="/advertise">Advertise</Link></div>
        </div>
        <div className="section-shell footer-bottom"><span>© 2026 Skilho. All rights reserved.</span><span>Built for people who build things.</span></div>
      </footer>
    </main>
  );
}
