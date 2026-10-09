'use client';

import { useEffect, useState } from 'react';
import PortalShell from '../components/PortalShell';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<'employee' | 'employer'>('employee');
  useEffect(() => {
    const token = localStorage.getItem('skilho_token');
    if (!token) return;
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => { if (me?.role === 'EMPLOYER') setRole('employer'); })
      .catch(() => {});
  }, []);
  return <PortalShell role={role}>{children}</PortalShell>;
}
