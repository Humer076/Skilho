
'use client';

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';

type Message = {
  role: 'assistant' | 'user';
  text: string;
};

type Persona = 'admin' | 'employer' | 'technician' | 'general';

type ChatResponse = {
  configured?: boolean;
  answer?: string | null;
  message?: string | string[];
};

function personaFor(path: string): Persona {
  const normalizedPath = path.toLowerCase();

  if (
    normalizedPath.startsWith('/admin') ||
    normalizedPath.startsWith('/dashboard/admin')
  ) {
    return 'admin';
  }

  if (
    normalizedPath.startsWith('/employer') ||
    normalizedPath.startsWith('/dashboard/employer')
  ) {
    return 'employer';
  }

  if (
    normalizedPath.startsWith('/employee') ||
    normalizedPath.startsWith('/dashboard/employee') ||
    normalizedPath.startsWith('/jobs')
  ) {
    return 'technician';
  }

  return 'general';
}

const WELCOME_MESSAGES: Record<Persona, string> = {
  technician:
    'Welcome to Skilho Job Finder Assist! Ask about recommended jobs, job requirements, skill matching, or your applications. Job closing dates are not currently available in the job database.',

  employer:
    'Welcome to Skilho Hiring Assist! I can help you review your posted jobs, application counts, candidate application statuses, and recruitment activity using your employer account data.',

  admin:
    'Welcome to Skilho Admin Assist! Ask about platform statistics, active jobs, employer verification counts, and other available administrative information.',

  general:
    'Welcome to Skilho Assist! Ask about Skilho job-search guidance, advertising, sign-in, or account recovery.',
};

const SUGGESTED_QUESTIONS: Record<Persona, string[]> = {
  technician: [
    'Which jobs are recommended for me?',
    'Which jobs match my skills?',
    'What is the status of my applications?',
  ],

  employer: [
    'How many jobs have I posted?',
    'How many applicants applied to my jobs?',
    'Show me the application statuses for my jobs.',
    'Which of my jobs are active?',
  ],

  admin: [
    'How many active jobs are on Skilho?',
    'How many technicians and employers are registered?',
    'How many employer profiles are awaiting verification?',
  ],

  general: [
    'How do I find jobs on Skilho?',
    'How do I advertise with Skilho?',
    'How do I reset my password?',
  ],
};

function formatAssistantAnswer(raw: string): string {
  const value = raw.trim();

  if (!value) {
    return 'The assistant returned an empty response. Please try again.';
  }

  const cleaned = value
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    const parsed: unknown = JSON.parse(cleaned);

    if (Array.isArray(parsed)) {
      return formatJobList(parsed);
    }

    if (parsed && typeof parsed === 'object') {
      const object = parsed as Record<string, unknown>;

      if (typeof object.answer === 'string') {
        return object.answer.trim();
      }

      if (Array.isArray(object.recommendedJobs)) {
        return formatJobList(object.recommendedJobs);
      }

      if (Array.isArray(object.jobs)) {
        return formatJobList(object.jobs);
      }

      return (
        'I received a response that I could not format. ' +
        'Please try asking your question another way.'
      );
    }
  } catch {
    // A normal text answer does not need JSON parsing.
  }

  return value;
}

function formatJobList(jobs: unknown[]): string {
  if (jobs.length === 0) {
    return 'No matching jobs were found in the available results.';
  }

  const sections = jobs.slice(0, 10).map((item, index) => {
    if (!item || typeof item !== 'object') {
      return '';
    }

    const job = item as Record<string, unknown>;

    const title =
      typeof job.title === 'string' ? job.title : 'Untitled job';

    const employer =
      typeof job.employer === 'string'
        ? job.employer
        : 'Employer not listed';

    const location = [job.city, job.state]
      .filter(
        (part): part is string =>
          typeof part === 'string' &&
          part.trim().length > 0 &&
          part.toLowerCase() !== 'remote',
      )
      .join(', ');

    const salaryMin =
      typeof job.salaryMin === 'number' ? job.salaryMin : null;

    const salaryMax =
      typeof job.salaryMax === 'number' ? job.salaryMax : null;

    const skills = Array.isArray(job.matchedSkills)
      ? job.matchedSkills.filter(
          (skill): skill is string => typeof skill === 'string',
        )
      : [];

    const salary =
      salaryMin !== null && salaryMax !== null
        ? `₹${salaryMin.toLocaleString('en-IN')}–₹${salaryMax.toLocaleString('en-IN')}`
        : salaryMin !== null
          ? `From ₹${salaryMin.toLocaleString('en-IN')}`
          : salaryMax !== null
            ? `Up to ₹${salaryMax.toLocaleString('en-IN')}`
            : job.salaryNegotiable === true
              ? 'Negotiable'
              : 'Not specified';

    const details = [
      `${index + 1}. ${title}`,
      `Employer: ${employer}`,
      `Location: ${location || 'Not specified'}`,
      `Salary: ${salary}`,
      typeof job.experienceRequired === 'string'
        ? `Experience required: ${job.experienceRequired}`
        : '',
      skills.length
        ? `Matching skills: ${skills.join(', ')}`
        : '',
      typeof job.matchScore === 'number'
        ? `Match score: ${job.matchScore} points`
        : '',
    ].filter(Boolean);

    return details.join('\n');
  });

  return [
    'Here are the jobs from the available Skilho results:',
    '',
    sections.filter(Boolean).join('\n\n'),
  ].join('\n');
}

export default function SupportChatbot() {
  const pathname = usePathname() || '/';
  const persona = personaFor(pathname);

  const title =
    persona === 'admin'
      ? 'Admin Assist'
      : persona === 'employer'
        ? 'Hiring Assist'
        : persona === 'technician'
          ? 'Job Finder Assist'
          : 'Skilho Assist';

  const API = (
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  ).replace(/\/+$/, '');

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);

  const [messages, setMessages] = useState<Message[]>(() => [
    { role: 'assistant', text: WELCOME_MESSAGES[persona] },
  ]);

  useEffect(() => {
    setMessages([
      { role: 'assistant', text: WELCOME_MESSAGES[persona] },
    ]);
    setDraft('');
  }, [persona]);

  const suggested = useMemo(
    () => SUGGESTED_QUESTIONS[persona],
    [persona],
  );

  const send = useCallback(
    async (text = draft) => {
      const value = text.trim();

      if (!value || typing) {
        return;
      }

      setMessages((old) => [
        ...old,
        { role: 'user', text: value },
      ]);

      setDraft('');
      setTyping(true);

      try {
        const token = localStorage.getItem('skilho_token');

        if (!token) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              text:
                'Please sign in to your Skilho account before using the chatbot.',
            },
          ]);
          return;
        }

        const response = await fetch(`${API}/chatbot/answer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: value }),
        });

        const data = (await response.json().catch(() => null)) as
          | ChatResponse
          | null;

        if (!response.ok) {
          const backendMessage = Array.isArray(data?.message)
            ? data.message.join(', ')
            : data?.message;

          throw new Error(
            backendMessage ||
              'The Skilho assistant is temporarily unavailable.',
          );
        }

        if (data?.configured !== true) {
          throw new Error(
            'The Skilho assistant is not configured correctly. Please check the backend.',
          );
        }

        if (
          typeof data.answer !== 'string' ||
          !data.answer.trim()
        ) {
          throw new Error(
            'The Skilho assistant returned an empty response.',
          );
        }

        setMessages((old) => [
          ...old,
          {
            role: 'assistant',
            text: formatAssistantAnswer(data.answer!),
          },
        ]);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Unable to connect to the Skilho assistant.';

        setMessages((old) => [
          ...old,
          {
            role: 'assistant',
            text:
              `${errorMessage} ` +
              'Please check that the backend is running and try again.',
          },
        ]);
      } finally {
        setTyping(false);
      }
    },
    [API, draft, typing],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send();
  }

  return (
    <div className="sk-chat-root">
      {open && (
        <section
          className="sk-chat-panel"
          aria-label={`${title} chat`}
        >
          <header className="sk-chat-header">
            <span className="sk-chat-avatar">S</span>

            <div>
              <strong>Skilho {title}</strong>
              <small>
                <i /> Skilho AI · Role-specific assistance
              </small>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </header>

          <div className="sk-chat-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div
                className={`sk-chat-message ${message.role}`}
                key={`${index}-${message.role}`}
              >
                <span style={{ whiteSpace: 'pre-wrap' }}>
                  {message.text}
                </span>
              </div>
            ))}

            {messages.length === 1 && (
              <div className="sk-chat-suggestions">
                {suggested.map((question) => (
                  <button
                    type="button"
                    key={question}
                    disabled={typing}
                    onClick={() => void send(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            {typing && (
              <div className="sk-chat-message assistant">
                <span>Thinking…</span>
              </div>
            )}
          </div>

          <form className="sk-chat-form" onSubmit={submit}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask a Skilho-related question…"
              aria-label="Message Skilho Assist"
              maxLength={500}
              disabled={typing}
            />

            <button
              type="submit"
              aria-label="Send message"
              disabled={!draft.trim() || typing}
            >
              ➤
            </button>
          </form>

          <p className="sk-chat-note">
            Role-specific assistance · Never share passwords, OTPs, or API keys.
          </p>
        </section>
      )}

      <button
        className={`sk-chat-launcher ${open ? 'is-open' : ''}`}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? 'Close chat' : `Open ${title}`}
      >
        {open ? (
          '×'
        ) : (
          <>
            <span className="sk-chat-launch-icon">✦</span>
            <span>{title}</span>
          </>
        )}
      </button>
    </div>
  );
}
