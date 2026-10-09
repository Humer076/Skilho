'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import TechnicianProfileView, {
  TechProfile,
} from '../../../components/TechnicianProfileView';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://skilho.onrender.com';

type Job = {
  id: string;
  title: string;
  status?: string;
};

type SavedCandidate = {
  employeeProfile?: {
    id: string;
  };
};

type Message = {
  id: string;
  conversationId?: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: {
    id: string;
    displayName?: string | null;
    role?: string;
  };
};

type Conversation = {
  id: string;
  employeeProfile?: {
    id: string;
    user?: {
      displayName?: string | null;
    };
  };
  messages?: Message[];
};

export default function EmployerTechnicianPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);

  const [profile, setProfile] = useState<TechProfile | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [token, setToken] = useState('');

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [tagNote, setTagNote] = useState('');
  const [tagging, setTagging] = useState(false);

  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [sending, setSending] = useState(false);

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem('skilho_token');
    router.replace('/login/employer');
  }, [router]);

  const apiRequest = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const currentToken =
        token || localStorage.getItem('skilho_token') || '';

      if (!currentToken) {
        handleUnauthorized();
        throw new Error('Unauthorized');
      }

      const response = await fetch(`${API}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${currentToken}`,
          ...(options.body
            ? { 'Content-Type': 'application/json' }
            : {}),
          ...options.headers,
        },
      });

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const serverMessage = Array.isArray(data?.message)
          ? data.message.join(', ')
          : data?.message;

        throw new Error(
          serverMessage || `Request failed (error ${response.status})`,
        );
      }

      if (response.status === 204) return null;

      return response.json();
    },
    [token, handleUnauthorized],
  );

  // Load the technician's existing profile.
  useEffect(() => {
    const currentToken = localStorage.getItem('skilho_token');

    if (!currentToken) {
      router.replace('/login/employer');
      return;
    }

    setToken(currentToken);
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch(
          `${API}/employer/technicians/${encodeURIComponent(id)}`,
          {
            headers: {
              Authorization: `Bearer ${currentToken}`,
            },
          },
        );

        if (response.status === 401) {
          localStorage.removeItem('skilho_token');
          router.replace('/login/employer');
          return;
        }

        if (response.status === 403) {
          throw new Error(
            'Only approved companies can view technician profiles.',
          );
        }

        if (response.status === 404) {
          throw new Error(
            'This technician profile is not available. It may be hidden by the technician.',
          );
        }

        if (!response.ok) {
          throw new Error(
            `Could not load the profile (error ${response.status}).`,
          );
        }

        const data: TechProfile = await response.json();

        if (!cancelled) setProfile(data);
      } catch (err) {
        if (cancelled) return;

        const message =
          err instanceof Error ? err.message : 'Could not load profile.';

        if (message !== 'Unauthorized') {
          setError(
            err instanceof TypeError
              ? 'Cannot reach the backend. Check that it is running on port 3001.'
              : message,
          );
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  // Load employer jobs and saved-candidate status.
  useEffect(() => {
    if (!token || !profile) return;

    let cancelled = false;

    async function loadActions() {
      try {
        const [jobData, savedData] = await Promise.all([
          apiRequest('/employer/jobs'),
          apiRequest('/candidate-engagement/saved'),
        ]);

        if (cancelled) return;

        const jobList: Job[] = Array.isArray(jobData)
          ? jobData
          : Array.isArray(jobData?.jobs)
            ? jobData.jobs
            : [];

        setJobs(jobList);

        if (jobList.length > 0) {
          setSelectedJobId(jobList[0].id);
        }

        const savedList: SavedCandidate[] = Array.isArray(savedData)
          ? savedData
          : [];

        setSaved(
          savedList.some(
            (item) => item.employeeProfile?.id === id,
          ),
        );
      } catch (err) {
        if (cancelled) return;

        const message =
          err instanceof Error ? err.message : 'Could not load candidate actions.';

        if (message !== 'Unauthorized') setNotice(message);
      }
    }

    loadActions();

    return () => {
      cancelled = true;
    };
  }, [token, profile, id, apiRequest]);

  // Look for an existing conversation with this technician.
  useEffect(() => {
    if (!token || !profile) return;

    let cancelled = false;

    async function loadConversation() {
      try {
        const data = await apiRequest(
          '/candidate-engagement/conversations',
        );

        if (cancelled) return;

        const conversations: Conversation[] = Array.isArray(data)
          ? data
          : [];

        const existing = conversations.find(
          (conversation) => conversation.employeeProfile?.id === id,
        );

        if (existing) {
          setConversationId(existing.id);
          setMessages(existing.messages || []);
        }
      } catch {
        // The employer can still open or start the conversation later.
      }
    }

    loadConversation();

    return () => {
      cancelled = true;
    };
  }, [token, profile, id, apiRequest]);

  async function toggleSaved() {
    setSaving(true);
    setNotice('');

    try {
      if (saved) {
        await apiRequest(
          `/candidate-engagement/saved/${encodeURIComponent(id)}`,
          { method: 'DELETE' },
        );

        setSaved(false);
        setNotice('Technician removed from saved candidates.');
      } else {
        await apiRequest(
          `/candidate-engagement/saved/${encodeURIComponent(id)}`,
          { method: 'POST' },
        );

        setSaved(true);
        setNotice('Technician saved successfully.');
      }
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : 'Could not update saved status.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function tagTechnician() {
    if (!selectedJobId) {
      setNotice('Please select a job first.');
      return;
    }

    setTagging(true);
    setNotice('');

    try {
      await apiRequest(
        `/candidate-engagement/jobs/${encodeURIComponent(selectedJobId)}/tag/${encodeURIComponent(id)}`,
        {
          method: 'POST',
          body: JSON.stringify({
            note: tagNote.trim() || undefined,
          }),
        },
      );

      setNotice('Technician tagged for the selected job successfully.');
      setTagNote('');
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : 'Could not tag this technician.',
      );
    } finally {
      setTagging(false);
    }
  }

  async function openChat() {
    setChatOpen(true);
    setStartingChat(true);
    setNotice('');

    try {
      let activeConversationId = conversationId;

      if (!activeConversationId) {
        const conversation = await apiRequest(
          `/candidate-engagement/conversations/${encodeURIComponent(id)}`,
          { method: 'POST' },
        );

        activeConversationId = conversation.id;
        setConversationId(activeConversationId);
      }

      const data = await apiRequest(
        `/candidate-engagement/conversations/${encodeURIComponent(activeConversationId)}/messages`,
      );

      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : 'Could not open conversation.',
      );
    } finally {
      setStartingChat(false);
    }
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = messageText.trim();

    if (!content || !conversationId || sending) return;

    setSending(true);
    setNotice('');

    try {
      const message: Message = await apiRequest(
        `/candidate-engagement/conversations/${encodeURIComponent(conversationId)}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ content }),
        },
      );

      setMessages((previous) => [...previous, message]);
      setMessageText('');
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : 'Could not send message.',
      );
    } finally {
      setSending(false);
    }
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <div className="max-w-md rounded-xl bg-white p-6 text-center shadow">
          <p className="mb-4 text-red-600">{error}</p>
          <Link
            href="/dashboard/employer"
            className="font-semibold text-blue-600"
          >
            ← Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading technician profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/dashboard/employer"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to dashboard
        </Link>

        <TechnicianProfileView
          profile={profile}
          photoUrl={`${API}/employer/technicians/${id}/photo`}
          tokenKey="skilho_token"
        />

        <section className="space-y-5 rounded-xl bg-white p-6 shadow">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Candidate engagement
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Save this technician, tag them for a job, or start a
              conversation. They do not need to have applied.
            </p>
          </div>

          {notice && (
            <div
              role="status"
              className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700"
            >
              {notice}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={toggleSaved}
              disabled={saving}
              className="rounded-lg border border-blue-600 px-4 py-2 font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
            >
              {saving
                ? 'Please wait...'
                : saved
                  ? '♥ Unsave Candidate'
                  : '♡ Save Candidate'}
            </button>

            <button
              type="button"
              onClick={openChat}
              disabled={startingChat}
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {startingChat ? 'Opening...' : 'Message Technician'}
            </button>
          </div>

          <div className="border-t border-gray-200 pt-5">
            <h3 className="font-semibold text-gray-900">Tag for Job</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select one of your jobs to associate this technician with it.
            </p>

            {jobs.length === 0 ? (
              <p className="mt-3 text-sm text-amber-700">
                No jobs were found. Create a job first.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                <label
                  htmlFor="candidate-job"
                  className="block text-sm font-medium text-gray-700"
                >
                  Select job
                </label>

                <select
                  id="candidate-job"
                  value={selectedJobId}
                  onChange={(event) => setSelectedJobId(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900"
                >
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                      {job.status ? ` (${job.status})` : ''}
                    </option>
                  ))}
                </select>

                <label
                  htmlFor="tag-note"
                  className="block text-sm font-medium text-gray-700"
                >
                  Optional note
                </label>

                <textarea
                  id="tag-note"
                  value={tagNote}
                  onChange={(event) => setTagNote(event.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Why is this technician suitable for this job?"
                  className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                />

                <button
                  type="button"
                  onClick={tagTechnician}
                  disabled={tagging || !selectedJobId}
                  className="rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  {tagging ? 'Tagging...' : 'Tag Technician for Job'}
                </button>
              </div>
            )}
          </div>
        </section>

        {chatOpen && (
          <section className="overflow-hidden rounded-xl bg-white shadow">
            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <div>
                <h2 className="font-bold text-gray-900">Conversation</h2>
                <p className="text-sm text-gray-500">
                  Messages with this technician
                </p>
              </div>

              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="max-h-96 min-h-32 space-y-3 overflow-y-auto bg-gray-50 p-5">
              {startingChat ? (
                <p className="text-sm text-gray-500">
                  Loading conversation...
                </p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No messages yet. Send the first message below.
                </p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="flex justify-start">
                    <div className="max-w-[85%] rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900">
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {message.content}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(message.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={sendMessage}
              className="flex gap-2 border-t border-gray-200 p-4"
            >
              <input
                type="text"
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                maxLength={5000}
                placeholder="Write a message..."
                aria-label="Message"
                className="min-w-0 flex-1 rounded-lg border border-gray-300 p-3 text-gray-900"
              />

              <button
                type="submit"
                disabled={
                  sending || !messageText.trim() || startingChat
                }
                className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
