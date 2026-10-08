import Link from 'next/link';
import UtilityHeader from '../components/UtilityHeader';

export default function ComingSoonPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <UtilityHeader />
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-100 text-4xl">
          📱
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-950">
          The Skilho app is on its way
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-500">
          We&apos;re still building our Android and iOS apps. For now, you can do everything — post jobs, search
          technicians, apply, and manage your profile — right here on the website, and it works great on your
          phone&apos;s browser too.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/jobs"
            className="rounded-lg bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            Browse jobs
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-900 transition hover:border-violet-300 hover:bg-violet-50"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}