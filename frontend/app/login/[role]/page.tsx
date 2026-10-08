'use client';

import { useParams } from 'next/navigation';
import AuthForm from '../../components/AuthForm';

export default function LoginPage() {
  const params = useParams();
  const role = params.role === 'employer' ? 'employer' : 'technician';
  return <AuthForm mode="login" role={role} />;
}