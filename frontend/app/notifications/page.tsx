'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API = 'http://localhost:3000';

type Notif = {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

function IconBell() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>; }

export default function NotificationsPage() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const token = () => localStorage.getItem('skilho_token') ?? '';

  const load = useCallback(async () => {
    const t = localStorage.getItem('skilho_token');
    if (!t) {
      router.replace('/');
      return;
    }
    try {
      const res = await fetch(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.status === 401) {
        localStorage.removeItem('skilho_token');
        router.replace('/');
        return;
      }
      if (!res.ok) {
        throw new Error(`Could not load notifications (error ${res.status})`);
      }
      setNotifs(await res.json());
      setLoadError('');
    } catch (err) {
      setLoadError(
        err instanceof TypeError
          ? 'Cannot reach the backend. Is it running on port 3000?'
          : err instanceof Error
            ? err.message
            : 'Something went wrong',
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(n: Notif) {
    if (n.read) return;
    await fetch(`${API}/notifications/${n.id}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}` },
    });
    setNotifs((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
    );
  }

  async function markAllRead() {
    await fetch(`${API}/notifications/read-all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}` },
    });
    setNotifs((prev) => prev.map((x) => ({ ...x, read: true })));
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading...</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="max-w-md bg-white rounded-xl shadow p-6 text-center">
          <p className="text-red-600">{loadError}</p>
        </div>
      </main>
    );
  }

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <main className="notification-page">
      <div className="notification-head">
        <div>
          <span className="portal-nav-label" style={{padding:0}}>ACTIVITY CENTER</span>
          <h1>Notifications</h1>
          <p>Important updates from your Skilho workspace.</p>
        </div>
        {unreadCount > 0 && <button onClick={markAllRead} className="mark-all">Mark all as read · {unreadCount}</button>}
      </div>

      {notifs.length === 0 ? (
        <div className="empty"><div className="notification-dot" style={{margin:'0 auto'}}><span>✓</span></div><strong>You’re all caught up</strong><span>No new notifications right now.</span></div>
      ) : (
        <ul className="notification-list">
          {notifs.map((n) => {
            const content = (
              <div className={`notification-item ${!n.read ? 'unread' : ''}`}>
                <div className="notification-dot"><IconBell /></div>
                <div className="notification-copy">
                  <strong>{n.read ? 'Notification' : 'New update'}</strong>
                  <p>{n.message}</p>
                  <time>{new Date(n.createdAt).toLocaleString()}</time>
                </div>
              </div>
            );
            return <li key={n.id} onClick={() => markRead(n)}>{n.link ? <Link href={n.link}>{content}</Link> : content}</li>;
          })}
        </ul>
      )}
    </main>
  );
}