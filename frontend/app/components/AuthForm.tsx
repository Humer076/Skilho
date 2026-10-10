
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://skilho.onrender.com';

type Props = {
  mode: 'login' | 'register';
  role: 'employer' | 'employee' | 'technician';
};

export default function AuthForm({ mode, role }: Props) {
  const router = useRouter();
  const reduce = useReducedMotion();

  const [identifier, setIdentifier] = useState('');
  const [mobile, setMobile] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const isEmployer = role === 'employer';
  const isRegister = mode === 'register';
  const isTechnician = role === 'technician' || role === 'employee';
  const isTechnicianRegistration = isRegister && isTechnician;

  const roleLabel = isEmployer ? 'Employer' : 'Technician';
  const accent = isEmployer ? '#5b5cf0' : '#0ea5a4';
  const accent2 = isEmployer ? '#7c3aed' : '#2563eb';

  async function apiRequest(path: string, body: Record<string, string>) {
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message;

      throw new Error(message || 'Something went wrong. Please try again.');
    }

    return data;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      // TECHNICIAN: request an email verification code.
      if (isTechnicianRegistration && !otpSent) {
        const data = await apiRequest(
          '/auth/employee-signup/request-otp',
          {
            email: identifier.trim().toLowerCase(),
            password,
            displayName: displayName.trim(),
            ...(mobile.trim() ? { mobile: mobile.trim() } : {}),
          },
        );

        setOtpSent(true);
        setNotice(
          data.message ||
            'Verification code requested. Check your email.',
        );
        return;
      }

      // TECHNICIAN: verify OTP and create the account.
      if (isTechnicianRegistration && otpSent) {
        const data = await apiRequest(
          '/auth/employee-signup/verify-otp',
          {
            email: identifier.trim().toLowerCase(),
            otp: otp.trim(),
          },
        );

        if (data.user?.role !== 'EMPLOYEE' || !data.token) {
          throw new Error(
            'Registration response was incomplete. Please contact support.',
          );
        }

        localStorage.setItem('skilho_token', data.token);
        router.push('/dashboard/employee');
        return;
      }

      // EXISTING EMPLOYER REGISTRATION OR LOGIN.
      let body: Record<string, string>;

      if (isRegister) {
        body = {
          password,
          role: 'EMPLOYER',
          companyName: companyName.trim(),
        };

        if (identifier.includes('@')) {
          body.email = identifier.trim();
        } else {
          body.mobile = identifier.trim();
        }
      } else {
        body = {
          identifier: identifier.trim(),
          password,
        };
      }

      const data = await apiRequest(`/auth/${mode}`, body);

      const expectedRole = isEmployer ? 'EMPLOYER' : 'EMPLOYEE';

      if (data.user?.role !== expectedRole || !data.token) {
        throw new Error(`This account is not a ${roleLabel} account`);
      }

      localStorage.setItem('skilho_token', data.token);
      router.push(`/dashboard/${isEmployer ? 'employer' : 'employee'}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError('');
    setNotice('');
    setLoading(true);

    try {
      const data = await apiRequest(
        '/auth/employee-signup/request-otp',
        {
          email: identifier.trim().toLowerCase(),
          password,
          displayName: displayName.trim(),
          ...(mobile.trim() ? { mobile: mobile.trim() } : {}),
        },
      );

      setOtp('');
      setNotice(data.message || 'A new verification code was requested.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not resend the code',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page min-h-screen bg-[#f7f8fc] text-slate-900">
      <div className="grid min-h-screen lg:h-screen lg:min-h-0 lg:grid-cols-[1.08fr_.92fr] lg:overflow-hidden">
        <section className="relative hidden min-h-0 overflow-hidden bg-[#090d1f] p-8 text-white lg:flex lg:flex-col lg:justify-between xl:p-10">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />

          <motion.div
            className="absolute -left-24 top-20 h-80 w-80 rounded-full blur-[90px]"
            style={{ background: accent }}
            animate={
              reduce
                ? {}
                : { x: [0, 45, 0], y: [0, 35, 0], scale: [1, 1.12, 1] }
            }
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.div
            className="absolute -right-24 bottom-0 h-96 w-96 rounded-full blur-[110px]"
            style={{ background: accent2, opacity: 0.55 }}
            animate={reduce ? {} : { x: [0, -35, 0], y: [0, -30, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative z-10 flex min-w-0 items-center gap-3">
            <img
              src="/skilho-logo.png"
              alt="Skilho"
              width={190}
              height={44}
              className="block h-11 w-[190px] max-w-full shrink-0 rounded-xl bg-white px-2 py-1.5 object-contain shadow-xl"
              style={{
                width: '190px',
                height: '44px',
                maxWidth: '100%',
                objectFit: 'contain',
                display: 'block',
                flexShrink: 0,
              }}
            />
            <div className="min-w-0 text-xs font-semibold text-white/45">
              Hire skilled. Work smarter.
            </div>
          </div>

          <div className="relative z-10 max-w-xl py-8 xl:py-10">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5 text-xs font-semibold text-white/70 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Secure {roleLabel.toLowerCase()} workspace
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-5xl font-black leading-[1.02] tracking-[-.045em]"
            >
              {isEmployer ? (
                <>
                  Build your team.
                  <br />
                  <span className="bg-gradient-to-r from-violet-300 via-indigo-300 to-sky-300 bg-clip-text text-transparent">
                    Faster.
                  </span>
                </>
              ) : (
                <>
                  Put your skills
                  <br />
                  <span className="bg-gradient-to-r from-white via-sky-200 to-violet-200 bg-clip-text text-transparent">
                    to work.
                  </span>
                </>
              )}
            </motion.h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-white/55">
              {isEmployer
                ? 'Discover verified technicians, manage job openings and move candidates through your hiring pipeline.'
                : 'Create your professional profile, showcase your skills and discover opportunities from verified companies.'}
            </p>

            <div className="mt-7 grid max-w-lg grid-cols-3 gap-3">
              {(isEmployer
                ? [['01', 'Post jobs'], ['02', 'Find talent'], ['03', 'Hire']]
                : [['01', 'Build profile'], ['02', 'Show skills'], ['03', 'Get hired']]
              ).map(([n, title]) => (
                <div
                  key={n}
                  className="rounded-2xl border border-white/10 bg-white/[.045] p-4 backdrop-blur"
                >
                  <div className="text-[10px] font-bold text-white/30">{n}</div>
                  <div className="mt-2 text-sm font-semibold text-white/75">
                    {title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-white/30">
            <span>© 2026 Skilho</span>
            <span>Professional hiring platform</span>
          </div>
        </section>

        <section className="relative flex items-center justify-center px-5 py-12 sm:px-8 sm:py-10 lg:min-h-0 lg:p-6 xl:p-8">
          <div className="absolute right-5 top-5 z-20">
            <ThemeToggle compact />
          </div>

          <div className="w-full max-w-[440px]">
            <div className="mb-7 flex items-center justify-between gap-3 lg:hidden">
              <Link href="/" aria-label="Skilho home" className="flex min-w-0 items-center gap-2.5">
                <img
                  src="/skilho-logo.png"
                  alt="Skilho"
                  width={150}
                  height={36}
                  className="block h-9 w-[150px] max-w-full object-contain"
                  style={{
                    width: '150px',
                    height: '36px',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </Link>
              <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm ring-1 ring-slate-200">
                {roleLabel}
              </span>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="rounded-[26px] border border-white/80 bg-white/85 p-6 shadow-[0_30px_90px_-35px_rgba(15,23,42,.28)] backdrop-blur-xl sm:p-7"
            >
              <div className="mb-5">
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-xl shadow-sm"
                  style={{ background: `${accent}12`, color: accent }}
                >
                  {isEmployer ? '⌂' : '✦'}
                </div>

                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="text-xs font-bold uppercase tracking-[.16em]"
                    style={{ color: accent }}
                  >
                    {roleLabel} portal
                  </span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="text-xs text-slate-400">
                    {isRegister ? 'Create account' : 'Welcome back'}
                  </span>
                </div>

                <h2 className="text-[1.7rem] font-black tracking-[-.035em]">
                  {isRegister
                    ? otpSent
                      ? 'Verify your email'
                      : `Create your ${roleLabel.toLowerCase()} account`
                    : 'Sign in to Skilho'}
                </h2>

                <p className="mt-1.5 text-sm leading-5 text-slate-500">
                  {otpSent
                    ? 'Enter the six-digit verification code sent to your email. It expires in 2 minutes.'
                    : isRegister
                      ? 'Set up your account and start using your workspace.'
                      : 'Continue to your personalized workspace.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {isTechnicianRegistration && !otpSent && (
                  <Field label="Full name">
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="modern-input"
                      placeholder="Your full name"
                      autoComplete="name"
                    />
                  </Field>
                )}

                {isRegister && isEmployer && (
                  <Field label="Company name">
                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      className="modern-input"
                      placeholder="Your company name"
                    />
                  </Field>
                )}

                <Field label={isTechnicianRegistration ? 'Email address' : 'Email or mobile number'}>
                  <input
                    type={isTechnicianRegistration ? 'email' : 'text'}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    disabled={isTechnicianRegistration && otpSent}
                    className="modern-input disabled:opacity-60"
                    placeholder={
                      isTechnicianRegistration
                        ? 'you@example.com'
                        : 'Email or mobile number'
                    }
                    autoComplete="username"
                  />
                </Field>

                {isTechnicianRegistration && !otpSent && (
                  <Field label="Mobile number (optional)">
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="modern-input"
                      placeholder="Digits only, including country code"
                      autoComplete="tel"
                      pattern="[0-9]{6,15}"
                      title="Enter 6 to 15 digits, or leave blank"
                    />
                  </Field>
                )}

                {!otpSent && (
                  <Field label="Password">
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={isRegister ? 8 : undefined}
                        className="modern-input pr-20"
                        placeholder="Enter your password"
                        autoComplete={isRegister ? 'new-password' : 'current-password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100"
                      >
                        {showPw ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </Field>
                )}

                {isTechnicianRegistration && otpSent && (
                  <>
                    <Field label="Six-digit verification code">
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                        required
                        minLength={6}
                        maxLength={6}
                        pattern="[0-9]{6}"
                        className="modern-input text-center text-lg tracking-[.35em]"
                        placeholder="000000"
                      />
                    </Field>

                    <div className="text-right">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="text-xs font-bold disabled:opacity-50"
                        style={{ color: accent }}
                      >
                        Resend verification code
                      </button>
                    </div>
                  </>
                )}

                {!isRegister && (
                  <div className="-mt-1 text-right">
                    <Link
                      href="/forgot-password"
                      className="text-xs font-bold"
                      style={{ color: accent }}
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: 1, x: [0, -5, 5, 0] }}
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                  >
                    {error}
                  </motion.div>
                )}

                {notice && (
                  <div
                    role="status"
                    className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
                  >
                    {notice}
                  </div>
                )}

                <motion.button
                  whileHover={loading || reduce ? undefined : { y: -2 }}
                  whileTap={loading || reduce ? undefined : { scale: 0.985 }}
                  disabled={loading}
                  type="submit"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg transition disabled:opacity-60"
                  style={{
                    background: `linear-gradient(135deg,${accent},${accent2})`,
                    boxShadow: `0 16px 30px -15px ${accent}`,
                  }}
                >
                  {loading && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  {loading
                    ? 'Please wait...'
                    : otpSent
                      ? 'Verify OTP and create account'
                      : isRegister
                        ? isTechnicianRegistration
                          ? 'Send verification code'
                          : 'Create account'
                        : 'Sign in'}
                </motion.button>

                {isTechnicianRegistration && otpSent && (
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                      setError('');
                      setNotice('');
                    }}
                    className="w-full py-1 text-sm font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Back to registration details
                  </button>
                )}
              </form>

              <div className="mt-5 border-t border-slate-100 pt-4 text-center text-sm text-slate-500">
                {isRegister ? (
                  <>
                    Already have an account?{' '}
                    <Link
                      className="font-bold"
                      style={{ color: accent }}
                      href={`/login/${isEmployer ? 'employer' : 'technician'}`}
                    >
                      Sign in
                    </Link>
                  </>
                ) : (
                  <>
                    New to Skilho?{' '}
                    <Link
                      className="font-bold"
                      style={{ color: accent }}
                      href={`/register/${isEmployer ? 'employer' : 'technician'}`}
                    >
                      Create an account
                    </Link>
                  </>
                )}
              </div>
            </motion.div>

            <div className="mt-5 text-center">
              <Link href="/" className="text-xs font-semibold text-slate-400 hover:text-slate-600">
                ← Back to Skilho home
              </Link>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        .modern-input {
          width: 100%;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 16px;
          padding: 11px 14px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          transition: 0.2s;
        }
        .modern-input:focus {
          background: #fff;
          border-color: ${accent};
          box-shadow: 0 0 0 4px ${accent}12;
        }
        .modern-input::placeholder {
          color: #94a3b8;
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[.08em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
