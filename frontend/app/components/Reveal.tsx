"use client";

import { useEffect, useRef, useState } from "react";

type From = "up" | "left" | "right" | "zoom";

export default function Reveal({
  children,
  className = "",
  delay = 0,
  from = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  from?: From;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal reveal-${from} ${shown ? "reveal-in" : ""} ${className}`}
    >
      {children}
    </div>
  );
}