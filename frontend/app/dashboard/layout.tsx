'use client';

import { usePathname } from 'next/navigation';
import PortalShell from '../components/PortalShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const role = pathname.startsWith('/dashboard/employer') ? 'employer' : 'employee';
  return <PortalShell role={role}>{children}</PortalShell>;
}
