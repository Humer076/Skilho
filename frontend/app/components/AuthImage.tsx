'use client';

import { useEffect, useState } from 'react';

type Props = {
  url: string;
  tokenKey: string;
  alt: string;
  className?: string;
  refreshKey?: number;
  fallback: React.ReactNode;
};

export default function AuthImage({
  url,
  tokenKey,
  alt,
  className,
  refreshKey = 0,
  fallback,
}: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(tokenKey);
    if (!token) return;

    let cancelled = false;
    let objectUrl: string | null = null;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error('No image');
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, tokenKey, refreshKey]);

  if (!src) return <>{fallback}</>;

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} />;
}