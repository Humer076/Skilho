import UtilityHeader from '../components/UtilityHeader';

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <UtilityHeader />
      <div className="mx-auto w-full max-w-4xl px-6 py-14 sm:py-16">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-violet-600">Get in touch</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">We&apos;d love to hear from you</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-500 sm:text-lg">
          Whether you&apos;re a company looking to advertise, a technician with a question, or just curious about Skilho — reach out and our team will get back to you.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="min-h-28 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.06]"><p className="text-sm font-semibold text-slate-400">Email</p><p className="mt-2 break-words font-bold text-slate-900">hello@skilho.com</p></div>
          <div className="min-h-28 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.06]"><p className="text-sm font-semibold text-slate-400">Phone</p><p className="mt-2 font-bold text-slate-900">+91 98765 43210</p></div>
          <div className="min-h-28 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.06]"><p className="text-sm font-semibold text-slate-400">Office</p><p className="mt-2 font-bold text-slate-900">Bengaluru, India</p></div>
        </div>
        <p className="mt-6 text-xs text-slate-400">This page shows placeholder contact details for demonstration purposes.</p>
      </div>
    </main>
  );
}
