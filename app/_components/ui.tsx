"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

// ═══════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════
export type IconProps = { className?: string };

export function InstagramIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function FacebookIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M14 8.5V7c0-.83.67-1.5 1.5-1.5H17V2.5h-2.5A4.5 4.5 0 0 0 10 7v1.5H8V12h2v9.5h4V12h2.7l.5-3.5H14Z" fill="currentColor" />
    </svg>
  );
}

export function LinkedInIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M5.2 7.3A1.7 1.7 0 1 0 5.2 4a1.7 1.7 0 0 0 0 3.3ZM3.7 9h3v10h-3V9Zm5 0h2.9v1.4h.04c.4-.8 1.4-1.7 3-1.7 3.2 0 3.8 2.1 3.8 4.8V19h-3v-4.9c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V19h-3V9Z" fill="currentColor" />
    </svg>
  );
}

export function XIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" fill="currentColor" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════
// TEXT SCRAMBLE (nav hover)
// ═══════════════════════════════════════════════════════════
const SCRAMBLE_CHARS = "!<>-_\\/[]{}—=+*^?#";

export function ScrambleText({ text, className = "" }: { text: string; className?: string }) {
  const [display, setDisplay] = useState(text);
  const raf = useRef<number | null>(null);

  const run = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    const queue = text.split("").map((to) => {
      const start = Math.floor(Math.random() * 12);
      return { to, start, end: start + 6 + Math.floor(Math.random() * 14), char: "" };
    });
    let frame = 0;
    const update = () => {
      let out = "";
      let done = 0;
      for (const q of queue) {
        if (frame >= q.end) {
          done++;
          out += q.to;
        } else if (frame >= q.start) {
          if (!q.char || Math.random() < 0.3) q.char = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          out += q.char;
        } else out += q.to;
      }
      setDisplay(out);
      if (done < queue.length) {
        frame++;
        raf.current = requestAnimationFrame(update);
      }
    };
    update();
  };

  useEffect(() => () => void (raf.current && cancelAnimationFrame(raf.current)), []);

  return (
    <span className={className} onMouseEnter={run}>
      {display}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// MAGNETIC BUTTON
// ═══════════════════════════════════════════════════════════
export function MagneticButton({
  children,
  className = "",
  strength = 0.3,
  ...props
}: { children: ReactNode; className?: string; strength?: number } & React.ComponentPropsWithoutRef<"button">) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { damping: 15, stiffness: 150 });
  const sy = useSpring(y, { damping: 15, stiffness: 150 });

  return (
    <motion.button
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ x: sx, y: sy }}
      className={className}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {children}
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════
// CUSTOM CURSOR (desktop only)
// ═══════════════════════════════════════════════════════════
export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.documentElement.classList.add("has-cursor");
    let mx = -100;
    let my = -100;
    let rx = -100;
    let ry = -100;
    let hover = false;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      const next = (e.target as HTMLElement).closest("button, a, [data-hover], input, select, textarea") !== null;
      if (next !== hover && ring.current) {
        hover = next;
        ring.current.dataset.hover = String(hover);
      }
      if (dot.current) dot.current.style.transform = `translate3d(${mx - 3}px, ${my - 3}px, 0)`;
    };
    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={ring} data-hover="false" className="cursor-ring pointer-events-none fixed left-0 top-0 z-[300] hidden" />
      <div ref={dot} className="cursor-dot pointer-events-none fixed left-0 top-0 z-[300] hidden h-1.5 w-1.5 rounded-full" />
    </>
  );
}
