"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CHAPTERS, type ChapterId } from "./site";

gsap.registerPlugin(ScrollTrigger);

// One Lenis instance drives the whole page. GSAP's ticker is the single clock:
// Lenis advances on it and ScrollTrigger reads Lenis' position on every scroll.
let lenis: Lenis | null = null;
export const getLenis = () => lenis;

export function SmoothScroll({ paused, children }: { paused: boolean; children: ReactNode }) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ScrollTrigger.config({ ignoreMobileResize: true });
    const instance = new Lenis({
      lerp: reduce ? 1 : 0.085,
      smoothWheel: !reduce,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
    });
    lenis = instance;
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenis = null;
    };
  }, []);

  useEffect(() => {
    if (!lenis) return;
    if (paused) lenis.stop();
    else {
      lenis.start();
      ScrollTrigger.refresh();
    }
  }, [paused]);

  return <>{children}</>;
}

/** Absolute scroll position of a story progress value (0–1). */
export function storyOffset(progress: number) {
  const el = document.getElementById("story-track");
  if (!el) return 0;
  const top = el.getBoundingClientRect().top + window.scrollY;
  return top + progress * (el.offsetHeight - window.innerHeight);
}

export type Anchor = ChapterId | "top" | "services" | "numbers" | "clients" | "contact";

export function scrollToAnchor(anchor: Anchor, immediate = false) {
  let y: number;
  const chapter = CHAPTERS.find((c) => c.id === anchor);
  if (anchor === "top") y = 0;
  else if (chapter) y = storyOffset(chapter.at);
  else {
    const el = document.getElementById(anchor);
    if (!el) return;
    y = el.getBoundingClientRect().top + window.scrollY - 72;
  }
  // Long jumps are fast-forwarded so the story still visibly "plays" but never drags.
  const distance = Math.abs(y - window.scrollY);
  const duration = Math.min(3.2, 0.9 + distance / 6000);
  if (lenis) lenis.scrollTo(y, { immediate, duration, force: true });
  else window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
}
