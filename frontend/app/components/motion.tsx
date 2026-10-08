'use client';

import { useEffect } from 'react';
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from 'framer-motion';

/* ---------- motion helpers ---------- */

export const EASE = [0.22, 1, 0.36, 1] as const;

export const stagger = (gap = 0.08, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

export const rise: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.96, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0.8, ease: EASE } },
};

export const word: Variants = {
  hidden: { y: '110%' },
  show: { y: 0, transition: { type: 'spring', stiffness: 110, damping: 15 } },
};

export const slideIn: Variants = {
  hidden: { opacity: 0, x: -14 },
  show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE } },
};

export function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => `${Math.round(v)}${suffix}`);

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 1.2, delay: 0.25, ease: EASE });
    return () => controls.stop();
  }, [value, reduce, mv]);

  return <motion.span className="tabular-nums">{text}</motion.span>;
}

export function GlowCard({
  children,
  className = '',
  variants,
  tilt = true,
}: {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
  tilt?: boolean;
}) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const sx = useSpring(x, { stiffness: 180, damping: 22 });
  const sy = useSpring(y, { stiffness: 180, damping: 22 });
  const glowOpacity = useSpring(0, { stiffness: 120, damping: 20 });
  const rotateX = useTransform(sy, [0, 1], tilt ? [6, -6] : [0, 0]);
  const rotateY = useTransform(sx, [0, 1], tilt ? [-6, 6] : [0, 0]);
  const gx = useTransform(sx, (v) => `${v * 100}%`);
  const gy = useTransform(sy, (v) => `${v * 100}%`);
  const glow = useMotionTemplate`radial-gradient(320px circle at ${gx} ${gy}, rgba(59,130,246,0.16), transparent 70%)`;

  return (
    <motion.div
      variants={variants}
      className={`relative ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width);
        y.set((e.clientY - r.top) / r.height);
      }}
      onMouseEnter={() => glowOpacity.set(1)}
      onMouseLeave={() => {
        glowOpacity.set(0);
        x.set(0.5);
        y.set(0.5);
      }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{ background: glow, opacity: glowOpacity }}
      />
      {children}
    </motion.div>
  );
}