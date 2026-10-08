import Link from 'next/link';

export default function UtilityHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-20 w-full max-w-4xl items-center justify-between px-6">
        <Link href="/" aria-label="Skilho home">
          <img src="/skilho-logo.png" alt="Skilho" className="h-auto w-[126px] object-contain" />
        </Link>
        <Link href="/" className="text-sm font-semibold text-violet-600 transition hover:text-violet-700">
          <span aria-hidden="true">←</span> Back to home
        </Link>
      </div>
    </header>
  );
}
