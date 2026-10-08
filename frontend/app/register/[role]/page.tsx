'use client';

import { useParams } from 'next/navigation';
import AuthForm from '../../components/AuthForm';

export default function RegisterPage() {
  const params = useParams();
  const role = params.role === 'employer' ? 'employer' : 'technician';
  return <AuthForm mode="register" role={role} />;
}