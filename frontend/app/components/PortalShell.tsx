'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon from './Icon';
import ThemeToggle from './ThemeToggle';
import SupportChatbot from './SupportChatbot';

export type PortalRole = 'employee' | 'employer';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://skilho.onrender.com';

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
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close the profile menu when clicking outside it.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load the logged-in user's profile.
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const token = localStorage.getItem('skilho_token');

      if (!token) {
        return;
      }

      try {
        const response = await fetch(`${API}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const me = await response.json();

        if (cancelled || !me) {
          return;
        }

        if (role === 'employer') {
          setName(me.employerProfile?.companyName || 'Company');
          setSubtitle('Employer workspace');
        } else {
          setName(
            me.fullName || me.email || me.mobile || 'Professional',
          );
          setSubtitle(
            me.email || me.mobile || 'Professional workspace',
          );
        }
      } catch {
        // Keep the existing fallback profile labels if the request fails.
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [role]);

  const nav = role === 'employer' ? EMPLOYER_NAV : EMPLOYEE_NAV;
  const homeHref = `/dashboard/${role}`;
  const profileHref =
    role === 'employer' ? '/employer/profile' : '/employee/profile';

  const currentLabel = useMemo(() => {
    const item = nav.find(
      ([href]) =>
        pathname === href ||
        (href !== '/dashboard/' + role &&
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

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();

    const q = query.trim();

    if (!q) {
      router.push(
        role === 'employee' ? '/jobs' : '/employer/technicians',
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
    <div className={`portal-app portal-${role}`}>
      <aside className="portal-sidebar">
        <div className="portal-brand">
          <Link href={homeHref}>
            <Brand />
          </Link>
        </div>

        <nav
          className="portal-nav"
          aria-label="Workspace navigation"
        >
          <span className="portal-nav-label">WORKSPACE</span>

          {nav.map(([href, label, icon]) => {
            const active =
              pathname === href ||
              (href !== `/dashboard/${role}` &&
                pathname.startsWith(href + '/'));

            return (
              <Link
                key={href}
                href={href}
                className={active ? 'active' : ''}
              >
                <Icon name={icon} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="portal-main">
        <header className="portal-topbar">
          <div className="portal-heading">
            <strong>{currentLabel}</strong>
          </div>

          <div className="portal-top-actions">
            <form
              className="portal-search"
              onSubmit={submitSearch}
            >
              <Icon name="search" />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  role === 'employer'
                    ? 'Search candidates or jobs…'
                    : 'Search jobs, skills or companies…'
                }
                aria-label="Search"
              />

              <kbd>⌘ K</kbd>
            </form>

            <ThemeToggle compact />

            <Link
              href="/notifications"
              className="portal-icon-button"
              aria-label="Notifications"
            >
              <Icon name="bell" />
              <i />
            </Link>

            {/* Profile icon and dropdown menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() =>
                  setProfileMenuOpen((prev) => !prev)
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
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white border border-slate-200/90 shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {name}
                    </p>

                    <p className="text-[11px] text-slate-500 truncate">
                      {subtitle}
                    </p>
                  </div>

                  <div className="py-1">
                    <Link
                      href={profileHref}
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                    >
                      <Icon
                        name="user"
                        className="w-4 h-4 text-slate-400"
                      />
                      <span>My Profile</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left"
                    >
                      <Icon
                        name="logout"
                        className="w-4 h-4 text-rose-500"
                      />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="portal-content">{children}</div>
      </main>

      {/* Skilho support chatbot for employee and employer portal pages */}
      <SupportChatbot />
    </div>
  );
}
