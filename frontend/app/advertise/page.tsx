import Link from 'next/link';
import AdvertiseEnquiryForm from './AdvertiseEnquiryForm';

const advertisingOptions = [
  { number: '01', title: 'Promote Job Openings', description: 'Put technician and skilled-professional roles in front of people looking for their next opportunity.', tone: 'blue', icon: '↗' },
  { number: '02', title: 'Featured Job Listings', description: 'Give selected openings more visibility to help the right candidates discover them.', tone: 'purple', icon: '✦' },
  { number: '03', title: 'Hiring Campaigns', description: 'Share your hiring needs across roles, locations, or a focused recruitment drive.', tone: 'green', icon: '◎' },
  { number: '04', title: 'Company Promotions', description: 'Introduce your company, services, or employer brand to Skilho professionals.', tone: 'orange', icon: '▣' },
];

const benefits = [
  ['Reach relevant talent', 'Connect your message with technicians and skilled professionals.'],
  ['Focus by role and location', 'Describe the work and locations that matter to your hiring needs.'],
  ['Show your company clearly', 'Give candidates a better understanding of your business and opportunities.'],
  ['Discuss the right approach', 'Tell us your goals so our team can follow up about suitable options.'],
];

function Arrow() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

export default function AdvertisePage() {
  return (
    <main className="advertise-page">
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" aria-label="Skilho home"><img src="/skilho-logo.png" alt="Skilho" className="home-logo-img" /></Link>
          <div className="header-actions"><Link href="/" className="login-link">Back to home</Link><Link href="/login/employer" className="header-cta">Employer Login <Arrow /></Link></div>
        </div>
      </header>

      <section className="advertise-hero">
        <div className="advertise-shell advertise-hero-inner">
          <div><span className="advertise-eyebrow"><i /> For companies and businesses</span><h1>Advertise with <em>Skilho.</em></h1><p>Reach skilled professionals and connect with the right talent through Skilho.</p><a className="primary-btn" href="#enquiry">Tell us what you need <Arrow /></a></div>
          <div className="advertise-hero-art" aria-hidden="true"><div className="advertise-art-ring ring-a"/><div className="advertise-art-ring ring-b"/><div className="advertise-art-core"><span>SK</span></div><div className="advertise-art-label">Skilled talent <b>↔</b> Your team</div></div>
        </div>
      </section>

      <section className="advertise-options-section">
        <div className="advertise-shell"><div className="advertise-section-heading"><span className="advertise-section-kicker">Ways to work together</span><h2>Share your opportunities with the right audience.</h2><p>Tell us what you want to promote. We can discuss an approach that fits your hiring or company goals.</p></div>
          <div className="advertise-options-grid">{advertisingOptions.map((option) => <article className={`advertise-option-card ${option.tone}`} key={option.number}><span className="advertise-option-number">{option.number}</span><div className="advertise-option-icon" aria-hidden="true">{option.icon}</div><h3>{option.title}</h3><p>{option.description}</p></article>)}</div>
        </div>
      </section>

      <section className="advertise-why-section"><div className="advertise-shell advertise-why-layout"><div className="advertise-why-heading"><span className="advertise-section-kicker">Why advertise on Skilho?</span><h2>Make your hiring message more relevant.</h2><p>Skilho is focused on technical roles and the professionals who do this work. Share what you need, and our team can help discuss the next step.</p></div><div className="advertise-benefits-grid">{benefits.map(([title, text], index) => <article key={title}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></div></section>

      <section className="advertise-form-section" id="enquiry"><div className="advertise-shell advertise-form-layout"><div className="advertise-form-copy"><span className="advertise-section-kicker">Start a conversation</span><h2>Tell us about your advertising needs.</h2><p>Share a few details about your company and what you would like to promote. We&apos;ll use them to prepare an enquiry email for you.</p><div className="advertise-contact-note"><span>✉</span><div><strong>Prefer email?</strong><a href="mailto:hello@skilho.com">hello@skilho.com</a></div></div></div><AdvertiseEnquiryForm /></div></section>

      <footer className="about-footer"><div className="advertise-shell"><span>Connecting skilled people with the opportunities where they can do their best work.</span><Link href="/contact">Contact Skilho <Arrow /></Link></div></footer>
    </main>
  );
}
