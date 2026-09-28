"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DefaultLoadingManager } from "three";

// ═══════════════════════════════════════════════════════════
// LOADING SCREEN — plays the studio intro while the 3D world
// actually downloads (real progress from three's loading manager).
// ═══════════════════════════════════════════════════════════
const MIN_TIME = 2200;
const MAX_WAIT = 15000;

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const shown = useRef(0);
  const assets = useRef({ loaded: 0, total: 0, done: false });

  useEffect(() => {
    if (hidden) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [hidden]);

  useEffect(() => {
    const m = DefaultLoadingManager;
    const prevProgress = m.onProgress;
    const prevLoad = m.onLoad;
    m.onProgress = (url, loaded, total) => {
      assets.current = { loaded, total, done: loaded >= total };
      prevProgress?.(url, loaded, total);
    };
    m.onLoad = () => {
      assets.current.done = true;
      prevLoad?.();
    };
    const start = performance.now();
    const tick = setInterval(() => {
      const elapsed = performance.now() - start;
      const { loaded, total, done } = assets.current;
      const real = total > 0 ? loaded / total : 0;
      // ease the bar toward real progress; time alone can carry it to 30%
      const target = Math.max(real, Math.min(0.3, elapsed / 6000)) * 100;
      shown.current += (target - shown.current) * 0.18;
      const finished = (total > 0 && done) || elapsed > MAX_WAIT;
      if (finished) shown.current += (100 - shown.current) * 0.35;
      setProgress(shown.current);
      if (finished && elapsed > MIN_TIME && shown.current > 99) {
        clearInterval(tick);
        setHidden(true);
        setTimeout(onComplete, 250);
      }
    }, 60);
    return () => {
      clearInterval(tick);
      m.onProgress = prevProgress;
      m.onLoad = prevLoad;
    };
  }, [onComplete]);

  const stage = progress < 30 ? "Initializing" : progress < 70 ? "Loading the studio" : progress < 99 ? "Setting the lights" : "Ready to roll";

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[500] overflow-hidden bg-[#020308]"
          aria-live="polite"
        >
          <video
            playsInline
            muted
            autoPlay
            loop
            preload="auto"
            onPlaying={() => setVideoReady(true)}
            className="pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-700"
            style={{ opacity: videoReady ? 1 : 0 }}
          >
            <source src="/videos/intro.webm" type="video/webm" />
            <source src="/videos/intro.mp4" type="video/mp4" />
          </video>
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(2,3,8,0.7)_100%)]" />

          <div className="absolute left-6 top-6 flex items-center gap-2 md:left-8 md:top-8">
            <span className="rec-dot" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#ff4d6d]">Rec</span>
          </div>

          <div className="absolute inset-x-0 bottom-[calc(100lvh-100svh+2.5rem)] flex flex-col items-center gap-4 px-6">
            <p className="text-[18px] font-semibold uppercase tracking-[0.5em] text-white md:text-[22px]">DM Vibes</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[var(--muted)]">{stage}</p>
            <div className="relative h-px w-[min(280px,70vw)] overflow-hidden bg-white/10">
              <div
                className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,var(--accent),var(--violet))] shadow-[0_0_14px_var(--accent)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="font-mono text-[10px] tracking-[0.3em] text-white/50">{String(Math.floor(progress)).padStart(3, "0")}%</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
