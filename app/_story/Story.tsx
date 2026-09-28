"use client";

import dynamic from "next/dynamic";
import { useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CHAPTERS } from "../_lib/site";
import { scrollToAnchor } from "../_lib/scroll";
import { StoryContent } from "../_components/Sections";
import { createStoryState } from "./state";
import { buildStoryTimeline } from "./timeline";
import { detectQuality, type FrameGate, type Quality } from "./quality";

const StoryCanvas = dynamic(() => import("./Scene"), { ssr: false });

const RUNTIME = 180; // seconds of "film" the story represents

// Device tier is read once on the client (null during SSR).
let cachedQuality: Quality | null = null;
const getQuality = () => (cachedQuality ??= detectQuality());
const noopSubscribe = () => () => {};

const tc = (sec: number) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `00:${p(Math.floor(sec / 60))}:${p(Math.floor(sec) % 60)}:${p(Math.floor((sec % 1) * 24))}`;
};

// ═══════════════════════════════════════════════════════════
// STORY — one pinned viewport. The track below it is the scroll
// distance of the film; the page content then rides up over the
// final lounge frame while the 3D stays behind it.
// ═══════════════════════════════════════════════════════════
export default function Story({ ready, onStartProject }: { ready: boolean; onStartProject: () => void }) {
  const quality = useSyncExternalStore(noopSubscribe, getQuality, () => null);
  const state = useMemo(() => createStoryState(), []);
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const gate = useRef<FrameGate["current"]>(null);
  const hudNo = useRef<HTMLSpanElement>(null);
  const hudA = useRef<HTMLSpanElement>(null);
  const hudB = useRef<HTMLSpanElement>(null);
  const hudTime = useRef<HTMLSpanElement>(null);
  const hudRail = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!quality || !overlay.current || !section.current || !track.current) return;
    const ctx = gsap.context(() => {
      const tl = buildStoryTimeline(state, overlay.current!, { mobile: quality.mobile });
      let chapter = -1;
      tl.eventCallback("onUpdate", () => {
        const p = tl.progress();
        state.progress = p;
        if (hudTime.current) hudTime.current.textContent = tc(p * RUNTIME);
        if (hudRail.current) hudRail.current.style.transform = `scaleX(${p})`;
        let i = 0;
        while (i < CHAPTERS.length - 1 && p >= CHAPTERS[i + 1].from) i++;
        if (i !== chapter) {
          chapter = i;
          const c = CHAPTERS[i];
          if (hudNo.current) hudNo.current.textContent = c.no;
          if (hudA.current) hudA.current.textContent = c.label[0];
          if (hudB.current) hudB.current.textContent = c.label[1];
          gsap.fromTo([hudNo.current, hudA.current, hudB.current], { yPercent: 40, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, stagger: 0.05, ease: "power3.out" });
        }
      });
      tl.progress(0.0001).progress(0);

      ScrollTrigger.create({ trigger: track.current, start: "top top", end: "bottom bottom", animation: tl, scrub: quality.mobile ? 0.7 : 1.1 });

      // Render gating: the world only renders while it can change. Once the
      // film has ended and the content is on top, one last frame is kept.
      let settle: ReturnType<typeof setTimeout> | undefined;
      const set = (mode: "always" | "never") => gate.current?.(mode);
      ScrollTrigger.create({
        trigger: track.current,
        start: "top bottom",
        end: "bottom bottom",
        onToggle: (self) => {
          clearTimeout(settle);
          if (self.isActive) set("always");
          else settle = setTimeout(() => set("never"), 1600);
        },
      });

      if (process.env.NODE_ENV !== "production") {
        // Dev handle: __story.seek(0.45) jumps the film (scroll + playhead) to 45%.
        const seek = (p: number) => {
          const el = track.current!;
          window.scrollTo(0, el.offsetTop + p * (el.offsetHeight - window.innerHeight));
          tl.progress(p);
        };
        (window as unknown as { __story: unknown }).__story = { state, tl, seek };
      }
      return () => clearTimeout(settle);
    }, overlay);
    return () => ctx.revert();
  }, [quality, state]);

  // Opening: the studio lights come up once the loader clears — the only time-based move.
  useEffect(() => {
    if (!ready) return;
    const tween = gsap.to(state, { intro: 1, duration: 2.8, ease: "power2.inOut", delay: 0.2 });
    const ctx = gsap.context(() => {
      gsap.from("[data-hud-top] > *", { y: 20, autoAlpha: 0, duration: 1.2, stagger: 0.1, ease: "expo.out", delay: 0.8 });
    }, overlay);
    return () => {
      tween.kill();
      ctx.revert();
    };
  }, [ready, state]);

  return (
    <section id="story" ref={section} className="relative" aria-label="DM Vibes — the story">
      <div className="sticky top-0 z-0 h-lvh w-full overflow-hidden bg-[#030309]">
        {quality && <StoryCanvas s={state} q={quality} gate={gate} />}

        <div aria-hidden className="pointer-events-none absolute inset-0 portrait:bg-[linear-gradient(0deg,rgba(3,3,9,0.9)_0%,rgba(3,3,9,0.5)_32%,transparent_56%)] landscape:bg-[linear-gradient(90deg,rgba(3,3,9,0.55)_0%,transparent_45%)]" />

        <div ref={overlay} className="pointer-events-none absolute inset-0">
          <Chapter id="media" title={["Media", "Production"]} body="From vision to reality, we create high-quality content that makes an impact." />
          <Chapter id="drone" title={["Drone"]} body="A higher perspective for bigger stories." />
          <Chapter id="edit" title={["Video", "Editing"]} body="Crafting every frame with precision." />
          <Chapter id="social" title={["Social", "Media"]} body="Strategies that make you visible." />
          <Chapter id="creative" title={["Creative", "Design"]} body="Lighting ideas into real experiences." />

          <div data-hud className="absolute inset-0">
            {/* chapter index, top-left — like the storyboard frames */}
            <div data-hud-top className="absolute left-5 top-20 flex items-start gap-4 landscape:left-10 landscape:top-24">
              <span ref={hudNo} className="block text-[34px] font-extralight leading-none tabular-nums text-white landscape:text-[44px]">
                01
              </span>
              <span className="mt-0.5 flex flex-col text-[13px] font-light leading-snug text-white/85 landscape:text-[15px]">
                <span ref={hudA}>Start</span>
                <span ref={hudB}>Logo Reveal</span>
              </span>
            </div>

            {/* scroll cue, left */}
            <div className="absolute bottom-[calc(100lvh-100svh+4.5rem)] left-5 hidden flex-col items-start gap-3 landscape:left-10 landscape:flex">
              <span className="text-[9px] font-medium uppercase tracking-[0.3em] text-white/55">Scroll</span>
              <span className="scroll-cue" />
            </div>
            <div data-intro-cue className="absolute inset-x-0 bottom-[calc(100lvh-100svh+4.5rem)] flex flex-col items-center gap-3 landscape:hidden">
              <span className="text-[9px] font-medium uppercase tracking-[0.3em] text-white/55">Scroll</span>
              <span className="scroll-cue" />
            </div>

            {/* playhead */}
            <div className="absolute inset-x-0 bottom-0 px-5 pb-[calc(100lvh-100svh+1rem)] landscape:px-10 landscape:pb-6">
              <div className="flex items-end justify-between text-[10px] font-medium uppercase tracking-[0.28em] text-white/45">
                <span className="flex items-center gap-2">
                  <span className="rec-dot" /> DM Vibes Studio
                </span>
                <span ref={hudTime} className="hidden tabular-nums landscape:inline">
                  00:00:00:00
                </span>
              </div>
              <div className="relative mt-3 h-px w-full bg-white/10">
                <div ref={hudRail} className="absolute inset-0 origin-left scale-x-0 bg-[linear-gradient(90deg,var(--accent),var(--violet))]" />
                {CHAPTERS.slice(1).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => scrollToAnchor(c.id)}
                    className="pointer-events-auto absolute -top-2 h-4 w-4 -translate-x-1/2"
                    style={{ left: `${c.at * 100}%` }}
                    aria-label={`Jump to ${c.label.join(" ")}`}
                    data-hover
                  >
                    <span className="mx-auto block h-1.5 w-px bg-white/40" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* the film's scroll distance */}
      <div id="story-track" ref={track} aria-hidden className="-mt-[100lvh] h-[1000vh] landscape:h-[1150vh]" />

      {/* page content over the final (lounge) frame */}
      <div className="relative z-10">
        <StoryContent onStartProject={onStartProject} />
      </div>
    </section>
  );
}

function Chapter({ id, title, body, children }: { id: string; title: string[]; body: string; children?: ReactNode }) {
  return (
    <div
      data-chapter={id}
      className="absolute inset-x-5 bottom-[calc(100lvh-100svh+5.5rem)] flex flex-col landscape:bottom-auto landscape:left-[7vw] landscape:right-auto landscape:top-[54%] landscape:w-[min(30rem,38vw)] landscape:-translate-y-1/2"
    >
      <h2 className="chapter-title">
        {title.map((l, i) => (
          <span key={i} data-line className="block overflow-hidden">
            <span className="block will-change-transform">{l}</span>
          </span>
        ))}
      </h2>
      <span data-bar className="mt-6 block h-[3px] w-12 origin-left bg-[var(--accent)]" />
      <p data-fade className="mt-6 max-w-[19rem] text-[13px] leading-relaxed text-white/60">
        {body}
      </p>
      <span data-fade className="mt-8 flex flex-col items-start gap-2 text-[9px] font-medium uppercase tracking-[0.3em] text-white/45">
        Scroll <span aria-hidden>↓</span>
      </span>
      {children}
    </div>
  );
}
