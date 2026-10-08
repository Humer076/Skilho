import PortalShell from '../components/PortalShell';

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell role="employer">{children}</PortalShell>;
}
