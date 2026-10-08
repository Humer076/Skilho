import UtilityHeader from '../components/UtilityHeader';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <UtilityHeader />
      <div className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-950">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: September 2026</p>

        <div className="mt-8 space-y-8 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-900">1. Information we collect</h2>
            <p className="mt-2">
              We collect information you provide when creating an account, building your profile, or posting a
              job — including your name, contact details, work history, skills, and company information.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-slate-900">2. How we use your information</h2>
            <p className="mt-2">
              We use your information to connect technicians with employers, verify companies, process
              applications, and improve the Skilho platform.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-slate-900">3. Sharing of information</h2>
            <p className="mt-2">
              A technician&apos;s contact details are shared with an employer only when the technician chooses to
              allow it. Company documents are visible only to Skilho administrators for verification purposes.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-slate-900">4. Data security</h2>
            <p className="mt-2">
              We use industry-standard measures to protect your data, including private document storage and
              access controls.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-slate-900">5. Contact us</h2>
            <p className="mt-2">
              For questions about this policy, reach out via our{' '}
              <a href="/contact" className="text-violet-600 font-semibold">
                contact page
              </a>
              .
            </p>
          </section>
        </div>

        <p className="mt-10 text-sm text-slate-400">
          This is placeholder policy text for demonstration purposes.
        </p>
      </div>
    </main>
  );
}