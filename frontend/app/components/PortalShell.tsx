'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon from './Icon';
import ThemeToggle from './ThemeToggle';
import SupportChatbot from './SupportChatbot';

export type PortalRole = 'employee' | 'employer';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://skilho.onrender.com';

const EMPLOYEE_NAV = [
  ['/dashboard/employee', 'Overview', 'home'],
  ['/employee/profile', 'My Profile', 'user'],
  ['/employee/skills', 'Skills', 'tool'],
  ['/employee/career', 'Career Journey', 'trending'],
  ['/employee/applications', 'Applications', 'clipboard'],
  ['/employee/saved-jobs', 'Saved Jobs', 'bookmark'],
  ['/employee/preview', 'Preview Profile', 'eye'],
  ['/jobs', 'Browse Jobs', 'search'],
] as const;

const EMPLOYER_NAV = [
  ['/dashboard/employer', 'Dashboard', 'home'],
  ['/employer/jobs', 'Jobs', 'briefcase'],
  ['/employer/technicians', 'Candidates', 'user'],
  ['/employer/documents', 'Documents', 'clipboard'],
  ['/employer/profile', 'Company Profile', 'chart'],
  ['/employer/packages', 'Packages & Credits', 'trending'],
] as const;

function Brand() {
  return (
    <img
      src="/skilho-logo.png"
      alt="Skilho"
      className="portal-logo"
    />
  );
}

export default function PortalShell({
  role,
  children,
}: {
  role: PortalRole;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [name, setName] = useState(
    role === 'employer' ? 'Company' : 'Professional',
  );

  const [subtitle, setSubtitle] = useState(
    role === 'employer'
      ? 'Employer workspace'
      : 'Professional workspace',
  );

  const [query, setQuery] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  // Close mobile navigation and menus after route changes.
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [pathname]);

  // Lock background scrolling while the mobile drawer is open.
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [mobileMenuOpen]);

  // Close profile menu when clicking outside.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside,
      );
    };
  }, []);

  // Load signed-in user information.
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const token = localStorage.getItem('skilho_token');

      if (!token) return;

      try {
        const response = await fetch(`${API}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const me = await response.json();

        if (cancelled || !me) return;

        if (role === 'employer') {
          setName(
            me.employerProfile?.companyName || 'Company',
          );
          setSubtitle('Employer workspace');
        } else {
          setName(
            me.fullName ||
              me.email ||
              me.mobile ||
              'Professional',
          );

          setSubtitle(
            me.email ||
              me.mobile ||
              'Professional workspace',
          );
        }
      } catch {
        // Keep the fallback profile information.
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [role]);

  // Focus mobile search when opened.
  useEffect(() => {
    if (mobileSearchOpen) {
      mobileSearchRef.current?.focus();
    }
  }, [mobileSearchOpen]);

  const nav =
    role === 'employer' ? EMPLOYER_NAV : EMPLOYEE_NAV;

  const homeHref = `/dashboard/${role}`;

  const profileHref =
    role === 'employer'
      ? '/employer/profile'
      : '/employee/profile';

  const currentLabel = useMemo(() => {
    const item = nav.find(
      ([href]) =>
        pathname === href ||
        (href !== `/dashboard/${role}` &&
          pathname.startsWith(href + '/')),
    );

    return (
      item?.[1] ||
      (role === 'employer' ? 'Employer' : 'Professional')
    );
  }, [nav, pathname, role]);

  function logout() {
    localStorage.removeItem('skilho_token');
    router.replace('/');
  }

  function submitSearch(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const q = query.trim();

    if (!q) {
      router.push(
        role === 'employee'
          ? '/jobs'
          : '/employer/technicians',
      );
      return;
    }

    router.push(
      role === 'employee'
        ? `/jobs?q=${encodeURIComponent(q)}`
        : `/employer/technicians?q=${encodeURIComponent(q)}`,
    );
  }

  return (
    <div
      className={`portal-app portal-${role} relative flex min-h-screen w-full min-w-0`}
    >
      {/* Mobile sidebar backdrop */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[2px] md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        id="portal-sidebar"
        aria-label="Main navigation"
        className={[
          'portal-sidebar',
          '!fixed !inset-y-0 !left-0 !z-50',
          '!h-[100dvh] !w-72 !max-w-[85vw]',
          '!overflow-x-hidden !overflow-y-auto',
          'transition-transform duration-300 ease-in-out',
          mobileMenuOpen
            ? '!translate-x-0'
            : '!-translate-x-full',
          'md:!sticky md:!top-0 md:!z-20',
          'md:!h-screen md:!w-auto md:!max-w-none',
          'md:!translate-x-0 md:!transform-none',
        ].join(' ')}
      >
        {/* Sidebar brand */}
        <div className="portal-brand flex min-h-16 items-center justify-between gap-3">
          <Link
            href={homeHref}
            onClick={() => setMobileMenuOpen(false)}
            className="min-w-0"
          >
            <Brand />
          </Link>

          {/* CSS/text close icon; no Icon.tsx dependency */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 md:hidden"
          >
            <span
              aria-hidden="true"
              className="text-3xl leading-none"
            >
              ×
            </span>
          </button>
        </div>

        {/* Workspace navigation */}
        <nav
          className="portal-nav"
          aria-label="Workspace navigation"
        >
          <span className="portal-nav-label">
            WORKSPACE
          </span>

          {nav.map(([href, label, icon]) => {
            const active =
              pathname === href ||
              (href !== `/dashboard/${role}` &&
                pathname.startsWith(href + '/'));

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={active ? 'active' : ''}
              >
                <Icon name={icon} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-4 py-4 md:hidden">
          <p className="text-xs text-slate-500">
            Skilho Workspace
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="portal-main !min-w-0 !w-0 flex-1">
        {/* Responsive topbar */}
        <header className="portal-topbar !sticky !top-0 !z-30 !flex !min-w-0 !flex-wrap !items-center !gap-2 !px-3 sm:!px-5 lg:!px-7">
          {/* Mobile hamburger button */}
          <button
            type="button"
            aria-label={
              mobileMenuOpen
                ? 'Close navigation menu'
                : 'Open navigation menu'
            }
            aria-controls="portal-sidebar"
            aria-expanded={mobileMenuOpen}
            onClick={() =>
              setMobileMenuOpen((previous) => !previous)
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 md:hidden"
          >
            <span
              aria-hidden="true"
              className="flex w-5 flex-col gap-1"
            >
              <span className="h-0.5 w-5 rounded bg-current" />
              <span className="h-0.5 w-5 rounded bg-current" />
              <span className="h-0.5 w-5 rounded bg-current" />
            </span>
          </button>

          {/* Current page heading */}
          <div className="portal-heading !min-w-0 flex-1">
            <strong className="block truncate text-sm sm:text-base">
              {currentLabel}
            </strong>

            <span className="hidden text-xs text-slate-500 sm:block">
              {role === 'employer'
                ? 'Employer workspace'
                : 'Professional workspace'}
            </span>
          </div>

          {/* Desktop search */}
          <form
            className="portal-search !hidden lg:!flex lg:!w-full lg:!max-w-sm lg:!min-w-0"
            onSubmit={submitSearch}
          >
            <Icon name="search" />

            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder={
                role === 'employer'
                  ? 'Search candidates or jobs...'
                  : 'Search jobs, skills or companies...'
              }
              aria-label="Search"
              className="!min-w-0"
            />

            <kbd>⌘ K</kbd>
          </form>

          {/* Topbar actions */}
          <div className="portal-top-actions !flex !shrink-0 !items-center !gap-1.5 sm:!gap-2">
            {/* Mobile search button */}
            <button
              type="button"
              aria-label="Open search"
              aria-expanded={mobileSearchOpen}
              onClick={() =>
                setMobileSearchOpen((previous) => !previous)
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 lg:hidden"
            >
              <Icon name="search" />
            </button>

            <div className="shrink-0">
              <ThemeToggle compact />
            </div>

            <Link
              href="/notifications"
              className="portal-icon-button !relative !shrink-0"
              aria-label="Notifications"
            >
              <Icon name="bell" />
              <i />
            </Link>

            {/* Profile dropdown */}
            <div
              className="relative shrink-0"
              ref={profileMenuRef}
            >
              <button
                type="button"
                onClick={() =>
                  setProfileMenuOpen((previous) => !previous)
                }
                className="portal-icon-button portal-profile-trigger"
                aria-label="Profile menu"
                aria-expanded={profileMenuOpen}
              >
                <span
                  className="portal-profile-avatar"
                  aria-hidden="true"
                >
                  {name.trim().charAt(0).toUpperCase() || 'U'}
                </span>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-[min(13rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-xl">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="truncate text-xs font-bold text-slate-900">
                      {name}
                    </p>

                    <p className="truncate text-[11px] text-slate-500">
                      {subtitle}
                    </p>
                  </div>

                  <div className="py-1">
                    <Link
                      href={profileHref}
                      onClick={() =>
                        setProfileMenuOpen(false)
                      }
                      className="flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                    >
                      <Icon
                        name="user"
                        className="h-4 w-4 text-slate-400"
                      />
                      <span>My Profile</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                    >
                      <Icon
                        name="logout"
                        className="h-4 w-4 text-rose-500"
                      />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile search field */}
          {mobileSearchOpen && (
            <form
              onSubmit={submitSearch}
              className="w-full min-w-0 pb-3 lg:hidden"
            >
              <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <Icon name="search" />

                <input
                  ref={mobileSearchRef}
                  value={query}
                  onChange={(event) =>
                    setQuery(event.target.value)
                  }
                  placeholder={
                    role === 'employer'
                      ? 'Search candidates or jobs...'
                      : 'Search jobs, skills or companies...'
                  }
                  aria-label="Search"
                  className="w-full min-w-0 bg-transparent text-sm text-slate-900 outline-none"
                />

                <button
                  type="button"
                  aria-label="Close search"
                  onClick={() => setMobileSearchOpen(false)}
                  className="shrink-0 px-1 text-lg text-slate-500"
                >
                  ×
                </button>
              </div>
            </form>
          )}
        </header>

        {/* Responsive page content */}
        <div className="portal-content !min-w-0 !w-full !max-w-full !overflow-x-clip">
          {children}
        </div>
      </main>

      {/* Employee and employer support chatbot */}
      <SupportChatbot />
    </div>
  );
}
