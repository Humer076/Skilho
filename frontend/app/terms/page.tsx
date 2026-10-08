import UtilityHeader from '../components/UtilityHeader';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <UtilityHeader />
      <div className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-950">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: September 2026</p>

        <div className="mt-8 space-y-8 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-900">1. Accepting these terms</h2>
            <p className="mt-2">
              By creating an account on Skilho, you agree to these terms and to use the platform honestly and
              lawfully.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-slate-900">2. Employer accounts</h2>
            <p className="mt-2">
              Employers must provide accurate company information and documents. Skilho reserves the right to
              reject, suspend, or reverify any employer account.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-slate-900">3. Technician profiles</h2>
            <p className="mt-2">
              Technicians are responsible for the accuracy of the skills, experience, and career history they
              list on their profile.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-slate-900">4. Job postings</h2>
            <p className="mt-2">
              Jobs must represent genuine employment opportunities. Misleading or fraudulent postings will be
              removed.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-slate-900">5. Termination</h2>
            <p className="mt-2">
              Skilho may suspend or terminate accounts that violate these terms or misuse the platform.
            </p>
          </section>
        </div>

        <p className="mt-10 text-sm text-slate-400">
          This is placeholder terms text for demonstration purposes.
        </p>
      </div>
    </main>
  );
}