'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('skilho_theme');
    const next = saved === 'dark';
    setDark(next);
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    localStorage.setItem('skilho_theme', next ? 'dark' : 'light');
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`theme-toggle ${compact ? 'theme-toggle-compact' : ''}`}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      <svg className="theme-toggle-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {dark ? (
          <path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.6 8.6 0 1 0 20.2 15.4Z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="3.5" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
          </>
        )}
      </svg>
      {!compact && <span>{dark ? 'Light' : 'Dark'}</span>}
    </button>
  );
}
