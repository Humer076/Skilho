import PortalShell from '../components/PortalShell';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell role="employee">{children}</PortalShell>;
}
