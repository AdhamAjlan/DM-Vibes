"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  Suspense,
  useCallback,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import Lenis from "lenis";

// ═══════════════════════════════════════════════════════════
// THEME PALETTE
// ═══════════════════════════════════════════════════════════
const PALETTE = {
  base: "#04050c",
  baseFog: "#070b18",
  electricBlue: "#4f7bff",
  electricBlueSoft: "#7aa2ff",
  violet: "#8b5cf6",
  violetSoft: "#a78bfa",
  deepPurple: "#6d28d9",
  keyWarm: "#8fb2ff",
  fillCool: "#3a4fa0",
  fillViolet: "#8b5cf6",
  rim: "#a78bfa",
  cityCool: "#4a5b8f",
};

const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/dmvibes.eg?stkn=MWJ1dmlqMDd2eG9tbQ==",
  facebook: "https://www.facebook.com/share/1YauMaWaua/?mibextid=wwXIfr",
  youtube: "https://youtube.com/@dmvibes",
  x: "https://x.com/dmvibes_eg",
};

const PROJECT_SERVICES = [
  "Digital Marketing",
  "Media Production",
  "Web Development",
  "Market Research",
  "Search Engine Optimization",
] as const;

// ═══════════════════════════════════════════════════════════
// SCENE METADATA
// ═══════════════════════════════════════════════════════════
const SCENES = [
  { id: "hero",      chapter: "01", title: "We Made Vibes",     subtitle: "Creative Studio · Egypt", range: [0.00, 0.11], tint: "#4f7bff" },
  { id: "about",     chapter: "02", title: "About Us",          subtitle: "We Made Vibes",           range: [0.12, 0.23], tint: "#5a7bff" },
  { id: "media",     chapter: "03", title: "Media Production",  subtitle: "Service 01",              range: [0.24, 0.34], tint: "#4f7bff" },
  { id: "marketing", chapter: "04", title: "Digital Marketing", subtitle: "Service 02",              range: [0.34, 0.44], tint: "#6d5fff" },
  { id: "drone",     chapter: "05", title: "Drone",             subtitle: "Service 03",              range: [0.44, 0.54], tint: "#6d28d9" },
  { id: "editing",   chapter: "06", title: "Video Editing",     subtitle: "Service 04",              range: [0.54, 0.64], tint: "#8b5cf6" },
  { id: "clients",   chapter: "07", title: "DM Clients",        subtitle: "Trusted Brands",          range: [0.64, 0.72], tint: "#4f7bff" },
  { id: "work",      chapter: "08", title: "Selected Work",     subtitle: "Our Projects",            range: [0.72, 0.80], tint: "#8b5cf6" },
  { id: "numbers",   chapter: "09", title: "The Numbers",       subtitle: "By The Numbers",          range: [0.80, 0.88], tint: "#a78bfa" },
  { id: "social",    chapter: "10", title: "Social Media",      subtitle: "Follow The Vibes",        range: [0.88, 0.96], tint: "#d946ef" },
  { id: "contact",   chapter: "11", title: "Let's Talk",        subtitle: "Start a Project",         range: [0.96, 1.01], tint: "#4f7bff" },
] as const;

const TOTAL_SCENES = SCENES.length;

// ═══════════════════════════════════════════════════════════
// SCROLL CONTEXT
// ═══════════════════════════════════════════════════════════
const ScrollCtx = createContext<React.MutableRefObject<number>>({ current: 0 });

function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const progress = useRef(0);
  const target = useRef(0);

  useEffect(() => {
    const isMobileDevice = window.matchMedia("(max-width: 768px)").matches;

    if (isMobileDevice) {
      const onScroll = () => {
        const max = document.body.scrollHeight - window.innerHeight;
        target.current = max > 0 ? window.scrollY / max : 0;
      };

      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });

      let lerpId: number;
      const lerp = () => {
        progress.current += (target.current - progress.current) * 0.12;
        lerpId = requestAnimationFrame(lerp);
      };
      lerpId = requestAnimationFrame(lerp);

      return () => {
        cancelAnimationFrame(lerpId);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    });

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      target.current = max > 0 ? window.scrollY / max : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    let lerpId: number;
    const lerp = () => {
      progress.current += (target.current - progress.current) * 0.1;
      lerpId = requestAnimationFrame(lerp);
    };
    lerpId = requestAnimationFrame(lerp);

    return () => {
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(lerpId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      lenis.destroy();
    };
  }, []);

  return <ScrollCtx.Provider value={progress}>{children}</ScrollCtx.Provider>;
}

const useScrollProgress = () => useContext(ScrollCtx);

function useScrollState() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      setP(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return p;
}

// ═══════════════════════════════════════════════════════════
// AMBIENT BACKGROUND
// ═══════════════════════════════════════════════════════════
function AmbientBackground() {
  const p = useScrollState();
  const activeScene = SCENES.find((s) => p >= s.range[0] && p <= s.range[1]) ?? SCENES[0];
  const tint = activeScene.tint;

  const heroImageOpacity = (() => {
    if (p < 0.00) return 0;
    if (p <= 0.09) return 1;
    if (p <= 0.13) return 1 - (p - 0.09) / 0.04;
    return 0;
  })();

  return (
    <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/images/studio-bg.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: heroImageOpacity,
          transition: "opacity 0.6s ease-out",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(4,5,12,0.65) 0%, rgba(4,5,12,0.35) 45%, rgba(4,5,12,0.85) 100%)",
          opacity: heroImageOpacity,
          transition: "opacity 0.6s ease-out",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, rgba(79,123,255,0.06) 0%, transparent 55%), radial-gradient(100% 90% at 50% 100%, rgba(109,40,217,0.08) 0%, transparent 60%)",
          transition: "background 1.2s ease-out",
        }}
      />

      <motion.div
        className="absolute rounded-full blur-[120px]"
        style={{
          width: "55vw", height: "55vw", left: "-10vw", top: "-10vh",
          background: `radial-gradient(circle, ${tint}30 0%, transparent 70%)`,
          transition: "background 1.2s ease-out",
        }}
        animate={{ x: [0, 60, -30, 0], y: [0, -40, 30, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full blur-[140px]"
        style={{
          width: "60vw", height: "60vw", right: "-15vw", top: "20vh",
          background: `radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 70%)`,
        }}
        animate={{ x: [0, -50, 40, 0], y: [0, 50, -30, 0], scale: [1, 1.1, 1.05, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute rounded-full blur-[160px]"
        style={{
          width: "70vw", height: "70vw", left: "20vw", bottom: "-30vh",
          background: `radial-gradient(circle, ${tint}22 0%, transparent 70%)`,
          transition: "background 1.2s ease-out",
        }}
        animate={{ x: [0, 40, -50, 0], y: [0, -30, 20, 0], scale: [1, 1.2, 1, 1] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />

      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(122,162,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(122,162,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      <motion.div
        className="absolute left-0 right-0 h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${tint}80, transparent)`,
          transition: "background 1.2s ease-out",
        }}
        animate={{ top: ["10%", "85%", "10%"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-0 right-0 h-[1px]"
        style={{ background: `linear-gradient(90deg, transparent, rgba(217,70,239,0.5), transparent)` }}
        animate={{ top: ["80%", "15%", "80%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(4,5,12,0.5) 85%, rgba(4,5,12,0.85) 100%)",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 💼 DIGITAL MARKETING ANIMATIONS
// ═══════════════════════════════════════════════════════════

function AnalyticsBars() {
  const p = useScrollState();
  const visible = p >= 0.32 && p <= 0.46;
  const localT = Math.min(1, Math.max(0, (p - 0.34) / 0.06));

  const bars = [0.35, 0.6, 0.45, 0.85, 0.7, 1.0, 0.55, 0.92];

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-36 md:bottom-40 left-4 md:left-6 z-[5] pointer-events-none hidden md:block"
    >
      <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          <span className="text-[8px] font-bold tracking-[2px] text-white/60">ENGAGEMENT · 30D</span>
        </div>
        <div className="flex items-end gap-1 h-14">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              className="w-2 rounded-t-sm"
              style={{
                background: `linear-gradient(to top, #4f7bff, #a78bfa)`,
                boxShadow: "0 0 10px rgba(79,123,255,0.5)",
              }}
              initial={{ height: 0 }}
              animate={{ height: `${h * 56 * localT}px` }}
              transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[7px] text-white/30 font-mono">
          <span>W1</span><span>W2</span><span>W3</span><span>W4</span>
        </div>
      </div>
    </motion.div>
  );
}

function KPIWidgets() {
  const p = useScrollState();
  const visible = p >= 0.32 && p <= 0.46;

  const kpis = [
    { label: "REACH", value: "+247%", color: "#4f7bff", delay: 0.1 },
    { label: "ENGAGEMENT", value: "+183%", color: "#a78bfa", delay: 0.2 },
    { label: "CONVERSIONS", value: "+94%", color: "#34d399", delay: 0.3 },
  ];

  if (!visible) return null;

  return (
    <div className="fixed top-40 md:top-44 right-4 md:right-6 z-[5] pointer-events-none hidden md:flex flex-col gap-2">
      {kpis.map((kpi) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ delay: kpi.delay, duration: 0.5 }}
          className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md px-3 py-2 min-w-[120px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-bold tracking-[2px] text-white/40">{kpi.label}</span>
            <motion.span
              className="text-[8px]"
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{ color: kpi.color }}
            >
              ▲
            </motion.span>
          </div>
          <span
            className="text-lg font-black tabular-nums"
            style={{ color: kpi.color, textShadow: `0 0 15px ${kpi.color}` }}
          >
            {kpi.value}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function GrowthLine() {
  const p = useScrollState();
  const visible = p >= 0.32 && p <= 0.46;
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed bottom-36 md:bottom-40 right-4 md:right-6 z-[5] pointer-events-none hidden md:block"
    >
      <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa]" />
          <span className="text-[8px] font-bold tracking-[2px] text-white/60">GROWTH · Q4</span>
        </div>
        <svg width="180" height="70" viewBox="0 0 180 70">
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4f7bff" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
            <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(79,123,255,0.35)" />
              <stop offset="100%" stopColor="rgba(79,123,255,0)" />
            </linearGradient>
          </defs>
          <motion.path
            d="M 0 55 L 20 48 L 40 52 L 60 38 L 80 42 L 100 25 L 120 30 L 140 15 L 160 20 L 180 8"
            stroke="url(#lineGrad)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ filter: "drop-shadow(0 0 6px rgba(79,123,255,0.8))" }}
          />
          <motion.path
            d="M 0 55 L 20 48 L 40 52 L 60 38 L 80 42 L 100 25 L 120 30 L 140 15 L 160 20 L 180 8 L 180 70 L 0 70 Z"
            fill="url(#areaGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          />
        </svg>
      </div>
    </motion.div>
  );
}

const HASHTAGS = [
  { text: "#viral", side: "left" },
  { text: "#trending", side: "right" },
  { text: "#brand", side: "left" },
  { text: "#reels", side: "right" },
  { text: "#content", side: "left" },
  { text: "#growth", side: "right" },
  { text: "#reach", side: "left" },
  { text: "#roi", side: "right" },
];

const DM_CLIENTS: Array<{ name: string; category: string; accent: string; logo: string }> = [
  { name: "ORASCOM", category: "Construction", accent: "#7dd3fc", logo: "/images/LOGOS/Orascom.png" },
  { name: "ACUD", category: "Development", accent: "#fbbf24", logo: "/images/LOGOS/ACUD.png" },
  { name: "GIZA", category: "Technology", accent: "#93c5fd", logo: "/images/LOGOS/GIZ.png" },
  { name: "GIZA SYSTEMS", category: "Technology", accent: "#60a5fa", logo: "/images/LOGOS/giza-systems.png" },
  { name: "HARBOR ENERGY", category: "Energy", accent: "#c4b5fd", logo: "/images/LOGOS/Harbour-Energy.png" },
  { name: "BUPA", category: "Healthcare", accent: "#5eead4", logo: "/images/LOGOS/Bupa.png" },
  { name: "SAINT GOBAIN", category: "Industry", accent: "#fda4af", logo: "/images/LOGOS/SAINT-GOBAIN.png" },
  { name: "BOSTA", category: "Logistics", accent: "#ef4444", logo: "/images/LOGOS/bosta.png" },
  { name: "FLYIN", category: "Travel", accent: "#38bdf8", logo: "/images/LOGOS/Flyin.png" },
  { name: "MADKOUR", category: "Construction", accent: "#60a5fa", logo: "/images/LOGOS/MADKOUR.png" },
  { name: "UNIVERSAL", category: "Technology", accent: "#93c5fd", logo: "/images/LOGOS/universal.png" },
  { name: "KONE", category: "Industry", accent: "#4f7bff", logo: "/images/LOGOS/KONE.png" },
  { name: "CHEMONICS", category: "Development", accent: "#fb923c", logo: "/images/LOGOS/Chemonics.png" },
  { name: "ARAB INNOVATION", category: "Innovation", accent: "#22d3ee", logo: "/images/LOGOS/Arab-Inovation.png" },
  { name: "USAID", category: "Development", accent: "#f43f5e", logo: "/images/LOGOS/USAID.png" },
  { name: "CFM", category: "Facilities", accent: "#f87171", logo: "/images/LOGOS/CFM.png" },
  { name: "STM", category: "Technology", accent: "#e5e7eb", logo: "/images/LOGOS/stm.png" },
  { name: "MOUNTAIN VIEW", category: "Real Estate", accent: "#60a5fa", logo: "/images/LOGOS/MOUNTAIN-VIEW.png" },
  { name: "ENACTUS", category: "Social Impact", accent: "#fbbf24", logo: "/images/LOGOS/enactus.png" },
  { name: "ARIA", category: "Technology", accent: "#67e8f9", logo: "/images/LOGOS/ARIA.png" },
  { name: "ORASCOM DEVELOPMENT", category: "Development", accent: "#fbbf24", logo: "/images/LOGOS/ORASCOM-DEVELOPMENT.png" },
  { name: "UNHCR", category: "Humanitarian", accent: "#38bdf8", logo: "/images/LOGOS/UNHCR.png" },
  { name: "NEXT", category: "Education", accent: "#4ade80", logo: "/images/LOGOS/NEXT.png" },
  { name: "QUEST TRAVEL", category: "Travel", accent: "#818cf8", logo: "/images/LOGOS/Quest.png" },
  { name: "UNICEF", category: "Humanitarian", accent: "#38bdf8", logo: "/images/LOGOS/UNICEF.png" },
  { name: "SPINNEYS", category: "Retail", accent: "#facc15", logo: "/images/LOGOS/Spinneys.png" },
  { name: "STARTUP HAUS CAIRO", category: "Entrepreneurship", accent: "#f8fafc", logo: "/images/LOGOS/startup_haus_cairo.png" },
];

function HashtagCloud() {
  const p = useScrollState();
  const visible = p >= 0.32 && p <= 0.46;
  if (!visible) return null;

  const leftColumn = HASHTAGS.filter((h) => h.side === "left");
  const rightColumn = HASHTAGS.filter((h) => h.side === "right");

  return (
    <div className="fixed inset-0 z-[4] pointer-events-none hidden md:block">
      {leftColumn.map((tag, i) => (
        <motion.div
          key={tag.text}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{
            opacity: [0, 0.55, 0.55, 0],
            scale: [0.7, 1, 1, 0.9],
            y: [0, -20, -30, -50],
          }}
          transition={{
            duration: 6,
            delay: i * 0.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute text-[10px] font-bold tracking-[2px] text-amber/60 whitespace-nowrap"
          style={{
            left: "3%",
            top: `${25 + i * 12}%`,
            textShadow: "0 0 12px rgba(79,123,255,0.6)",
          }}
        >
          {tag.text}
        </motion.div>
      ))}
      {rightColumn.map((tag, i) => (
        <motion.div
          key={tag.text}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{
            opacity: [0, 0.55, 0.55, 0],
            scale: [0.7, 1, 1, 0.9],
            y: [0, -20, -30, -50],
          }}
          transition={{
            duration: 6,
            delay: i * 0.6 + 0.3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute text-[10px] font-bold tracking-[2px] text-amber/60 whitespace-nowrap"
          style={{
            right: "5%",
            top: `${25 + i * 12}%`,
            textShadow: "0 0 12px rgba(79,123,255,0.6)",
          }}
        >
          {tag.text}
        </motion.div>
      ))}
    </div>
  );
}

function TrafficDots() {
  const p = useScrollState();
  const visible = p >= 0.32 && p <= 0.46;
  if (!visible) return null;

  const dots = [
    { startX: 4, startY: 15, endX: 4, endY: 45, delay: 0 },
    { startX: 96, startY: 20, endX: 96, endY: 55, delay: 0.6 },
    { startX: 4, startY: 70, endX: 4, endY: 88, delay: 1.2 },
    { startX: 96, startY: 65, endX: 96, endY: 82, delay: 1.8 },
  ];

  return (
    <div className="fixed inset-0 z-[4] pointer-events-none hidden md:block">
      {dots.map((dot, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: "#4f7bff",
            boxShadow: "0 0 8px #4f7bff, 0 0 16px rgba(79,123,255,0.5)",
          }}
          initial={{ left: `${dot.startX}%`, top: `${dot.startY}%`, opacity: 0 }}
          animate={{ left: `${dot.endX}%`, top: `${dot.endY}%`, opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 3,
            delay: dot.delay,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function LiveFollowerCounter() {
  const p = useScrollState();
  const visible = p >= 0.78 && p <= 0.94;
  const [count, setCount] = useState(245800);

  useEffect(() => {
    if (!visible) return;
    const int = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 5) + 1);
    }, 800);
    return () => clearInterval(int);
  }, [visible]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-40 md:top-44 left-4 md:left-6 z-[5] pointer-events-none hidden md:block"
    >
      <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="relative w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-emerald-400" />
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span className="text-[8px] font-bold tracking-[2px] text-white/60">LIVE · FOLLOWERS</span>
        </div>
        <div className="text-lg font-black tabular-nums text-white mt-1" style={{ textShadow: "0 0 15px rgba(217,70,239,0.5)" }}>
          {count.toLocaleString()}
        </div>
      </div>
    </motion.div>
  );
}

function CampaignTicker() {
  const p = useScrollState();
  const visible = p >= 0.30 && p <= 0.90;
  if (!visible) return null;

  const items = [
    "CAMPAIGN ACTIVE",
    "CTR +12.4%",
    "ROAS 4.2x",
    "IMPRESSIONS 2.4M",
    "ENGAGEMENT 18.6%",
    "REACH 891K",
    "CONVERSIONS +94%",
  ];

  const content = [...items, ...items];

  return (
    <div
      className="fixed bottom-14 md:bottom-16 left-0 right-0 z-[5] pointer-events-none hidden md:block overflow-hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="border-y border-white/5 bg-black/30 backdrop-blur-sm py-1.5">
        <div className="flex whitespace-nowrap animate-marquee">
          {content.map((item, i) => (
            <span key={i} className="flex items-center gap-2 pr-8">
              <span className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              <span className="text-[9px] font-bold tracking-[3px] text-white/50">{item}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🏆 SCENE 08 — THE NUMBERS (professional dashboard widgets)
// ═══════════════════════════════════════════════════════════

function ServicesDonut() {
  const p = useScrollState();
  const visible = p >= 0.72 && p <= 0.80;
  const localT = Math.min(1, Math.max(0, (p - 0.73) / 0.05));

  const segments = [
    { label: "MEDIA", value: 32, color: "#4f7bff" },
    { label: "MARKETING", value: 28, color: "#a78bfa" },
    { label: "DRONE", value: 18, color: "#d946ef" },
    { label: "EDITING", value: 22, color: "#34d399" },
  ];

  const size = 120;
  const radius = 42;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;

  if (!visible) return null;

  let accumulated = 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-24 left-6 z-[5] pointer-events-none hidden md:block"
    >
      <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa]" />
          <span className="text-[8px] font-bold tracking-[2px] text-white/60">SERVICES MIX</span>
        </div>
        <div className="flex items-center gap-3">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
              {segments.map((seg, i) => {
                const dashLength = (seg.value / 100) * circumference * localT;
                const gapLength = circumference - dashLength;
                const offset = -accumulated * circumference * localT;
                accumulated += seg.value / 100;
                return (
                  <circle
                    key={seg.label}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${dashLength} ${gapLength}`}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{
                      filter: `drop-shadow(0 0 6px ${seg.color}80)`,
                      transition: "stroke-dasharray 0.1s linear",
                    }}
                  />
                );
              })}
            </g>
            <text
              x="50%"
              y="47%"
              textAnchor="middle"
              className="fill-white font-black"
              style={{ fontSize: 18, fontWeight: 900 }}
            >
              {Math.floor(localT * 100)}%
            </text>
            <text
              x="50%"
              y="62%"
              textAnchor="middle"
              className="fill-white/40 font-bold"
              style={{ fontSize: 6, letterSpacing: 1 }}
            >
              TOTAL MIX
            </text>
          </svg>
          <div className="flex flex-col gap-1.5">
            {segments.map((seg) => (
              <div key={seg.label} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: seg.color, boxShadow: `0 0 6px ${seg.color}` }} />
                <span className="text-[8px] font-bold tracking-[1px] text-white/50">{seg.label}</span>
                <span className="text-[9px] font-black tabular-nums ml-auto" style={{ color: seg.color }}>{seg.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatRing({ color, delay = 0, size = 180 }: { color: string; delay?: number; size?: number }) {
  const p = useScrollState();
  const visible = p >= 0.72 && p <= 0.80;
  const localT = Math.min(1, Math.max(0, (p - 0.73) / 0.06));

  if (!visible) return null;

  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = 0.72 + delay * 0.1;
  const dash = circumference * progress * localT;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      style={{ opacity: 0.35 }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="2"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: `drop-shadow(0 0 8px ${color})` }}
      />
    </svg>
  );
}

function ComparisonBars() {
  const p = useScrollState();
  const visible = p >= 0.72 && p <= 0.80;
  const localT = Math.min(1, Math.max(0, (p - 0.73) / 0.06));

  const data = [
    { label: "PROJECTS", current: 120, previous: 68, color: "#4f7bff" },
    { label: "BRANDS", current: 35, previous: 20, color: "#a78bfa" },
    { label: "REVENUE", current: 100, previous: 55, color: "#34d399" },
  ];

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-24 right-6 z-[5] pointer-events-none hidden md:block"
    >
      <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-3 min-w-[220px]">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          <span className="text-[8px] font-bold tracking-[2px] text-white/60">YOY COMPARISON</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {data.map((row) => {
            const max = Math.max(row.current, row.previous);
            const currentW = (row.current / max) * 100 * localT;
            const previousW = (row.previous / max) * 100 * localT;
            return (
              <div key={row.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-bold tracking-[1px] text-white/50">{row.label}</span>
                  <span className="text-[9px] font-black tabular-nums" style={{ color: row.color }}>
                    +{Math.floor(((row.current - row.previous) / row.previous) * 100 * localT)}%
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1 flex-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${currentW}%`,
                          background: `linear-gradient(90deg, ${row.color}80, ${row.color})`,
                          boxShadow: `0 0 8px ${row.color}`,
                          transition: "width 0.1s linear",
                        }}
                      />
                    </div>
                    <span className="text-[8px] font-bold tabular-nums text-white/60 w-6 text-right">{row.current}</span>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-40">
                    <div className="h-[2px] flex-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-white/40"
                        style={{ width: `${previousW}%`, transition: "width 0.1s linear" }}
                      />
                    </div>
                    <span className="text-[8px] font-bold tabular-nums text-white/40 w-6 text-right">{row.previous}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-white/5">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1 rounded-full bg-white/60" />
            <span className="text-[7px] font-bold tracking-[1px] text-white/40">2024</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1 rounded-full bg-white/20" />
            <span className="text-[7px] font-bold tracking-[1px] text-white/40">2023</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RegionDots() {
  const p = useScrollState();
  const visible = p >= 0.72 && p <= 0.80;

  const regions = [
    { name: "CAIRO", x: 42, y: 38, active: true, delay: 0 },
    { name: "ALEXANDRIA", x: 22, y: 22, active: true, delay: 0.2 },
    { name: "DUBAI", x: 78, y: 44, active: true, delay: 0.4 },
    { name: "RIYADH", x: 82, y: 58, active: true, delay: 0.6 },
    { name: "DOHA", x: 70, y: 40, active: false, delay: 0.8 },
    { name: "BEIRUT", x: 58, y: 18, active: false, delay: 1.0 },
  ];

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-40 md:top-44 right-4 md:right-6 z-[5] pointer-events-none hidden md:block"
    >
      <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber shadow-[0_0_8px_#4f7bff]" />
          <span className="text-[8px] font-bold tracking-[2px] text-white/60">REGIONS · MENA</span>
        </div>
        <div className="relative w-[180px] h-[100px] rounded-lg overflow-hidden" style={{ background: "radial-gradient(circle at 50% 50%, rgba(79,123,255,0.08), transparent 70%)" }}>
          <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full opacity-30">
            <path
              d="M 20 15 Q 30 10 45 12 Q 60 15 75 22 Q 85 30 88 42 Q 85 55 70 55 Q 55 52 40 50 Q 25 48 15 40 Q 10 28 20 15 Z"
              fill="none"
              stroke="rgba(122,162,255,0.4)"
              strokeWidth="0.3"
            />
          </svg>
          {regions.map((region) => (
            <motion.div
              key={region.name}
              className="absolute"
              style={{
                left: `${region.x}%`,
                top: `${region.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: region.delay, duration: 0.4 }}
            >
              <span
                className="block w-1.5 h-1.5 rounded-full"
                style={{
                  background: region.active ? "#4f7bff" : "rgba(255,255,255,0.3)",
                  boxShadow: region.active ? "0 0 8px #4f7bff, 0 0 16px rgba(79,123,255,0.5)" : "none",
                }}
              />
              {region.active && (
                <motion.span
                  className="absolute inset-0 rounded-full border border-electric-blue"
                  style={{ borderColor: "#4f7bff" }}
                  animate={{ scale: [1, 3], opacity: [0.8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: region.delay }}
                />
              )}
              <span
                className="absolute whitespace-nowrap text-[6px] font-bold tracking-[1px]"
                style={{
                  left: "8px",
                  top: "-2px",
                  color: region.active ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)",
                }}
              >
                {region.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function RetentionCurve() {
  const p = useScrollState();
  const visible = p >= 0.72 && p <= 0.80;
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed top-40 md:top-44 left-4 md:left-6 z-[5] pointer-events-none hidden md:block"
    >
      <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          <span className="text-[8px] font-bold tracking-[2px] text-white/60">CLIENT RETENTION</span>
        </div>
        <svg width="150" height="60" viewBox="0 0 150 60">
          <defs>
            <linearGradient id="retentionGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(52,211,153,0.4)" />
              <stop offset="100%" stopColor="rgba(52,211,153,0)" />
            </linearGradient>
          </defs>
          <motion.path
            d="M 5 15 Q 30 20 50 22 Q 80 25 105 32 Q 130 42 145 48"
            stroke="#34d399"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ filter: "drop-shadow(0 0 6px #34d399)" }}
          />
          <motion.path
            d="M 5 15 Q 30 20 50 22 Q 80 25 105 32 Q 130 42 145 48 L 145 58 L 5 58 Z"
            fill="url(#retentionGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          />
          <motion.circle
            cx="5"
            cy="15"
            r="2"
            fill="#34d399"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
          />
          <motion.circle
            cx="145"
            cy="48"
            r="2"
            fill="#34d399"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.2, type: "spring" }}
          />
        </svg>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[7px] font-bold tracking-[1px] text-white/30">Y1</span>
          <span className="text-[8px] font-black tracking-[1px] text-emerald-400">+89%</span>
          <span className="text-[7px] font-bold tracking-[1px] text-white/30">Y5</span>
        </div>
      </div>
    </motion.div>
  );
}

function NumberParticles() {
  const p = useScrollState();
  const visible = p >= 0.72 && p <= 0.80;
  if (!visible) return null;

  const particles = [
    { text: "+120", x: 8, y: 20, delay: 0, color: "#4f7bff" },
    { text: "∞", x: 92, y: 30, delay: 0.5, color: "#a78bfa" },
    { text: "24/7", x: 15, y: 55, delay: 1.0, color: "#d946ef" },
    { text: "100%", x: 88, y: 70, delay: 1.5, color: "#34d399" },
    { text: "500+", x: 5, y: 78, delay: 2.0, color: "#4f7bff" },
    { text: "4.9", x: 94, y: 15, delay: 2.5, color: "#a78bfa" },
  ];

  return (
    <div className="fixed inset-0 z-[4] pointer-events-none hidden md:block">
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 0.5, 0.5, 0],
            y: [0, -30, -60, -90],
            scale: [0.5, 1, 1, 0.9],
          }}
          transition={{
            duration: 8,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute text-[10px] font-black tabular-nums"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            color: particle.color,
            textShadow: `0 0 12px ${particle.color}, 0 0 24px ${particle.color}60`,
          }}
        >
          {particle.text}
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ANIMATED CLIENT LOGO CARD (used inside the Clients overlay)
// ═══════════════════════════════════════════════════════════
function AnimatedClientCard({
  client,
  index,
  total,
}: {
  client: (typeof DM_CLIENTS)[number];
  index: number;
  total: number;
}) {
  const delay = 0.35 + (index / total) * 1.0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.85 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: false, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, scale: 1.06 }}
      className="group relative flex h-[56px] sm:h-[72px] md:h-[96px] items-center justify-center rounded-lg md:rounded-2xl border border-white/[0.07] bg-[#0a0e15]/70 px-1.5 py-1.5 md:px-3 md:py-3 backdrop-blur-sm transition-colors duration-500 hover:border-white/20"
      data-hover
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-lg md:rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ boxShadow: `0 0 28px ${client.accent}55, inset 0 0 0 1px ${client.accent}44` }}
      />

      <motion.div
        className="relative z-10 flex h-full w-full items-center justify-center"
        animate={{ y: [0, -3, 0] }}
        transition={{
          duration: 3 + (index % 5) * 0.4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: (index % 7) * 0.2,
        }}
      >
        <img
          src={client.logo}
          alt={`${client.name} logo`}
          loading="lazy"
          className="max-h-[32px] sm:max-h-[40px] md:max-h-[54px] w-full object-contain object-center opacity-80 transition-all duration-500 group-hover:opacity-100 group-hover:scale-110"
          style={{
            filter: "grayscale(1) invert(1) contrast(1.08) brightness(1.1)",
            mixBlendMode: "screen",
          }}
        />
      </motion.div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0.5 md:bottom-1 z-20 flex flex-col items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="text-[6px] md:text-[8px] font-black tracking-[1px] md:tracking-[2px]" style={{ color: client.accent }}>
          {client.name}
        </span>
        <span className="text-[5px] md:text-[6px] font-bold tracking-[1px] md:tracking-[2px] uppercase text-white/40">
          {client.category}
        </span>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// GLTF LOADER
// ═══════════════════════════════════════════════════════════
const GLTFModel = forwardRef<
  THREE.Group,
  {
    url: string;
    targetSize?: number;
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    onReady?: (g: THREE.Group) => void;
  }
>(function GLTFModel(
  { url, targetSize = 1, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, onReady },
  ref
) {
  const { scene } = useGLTF(url);

  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o: any) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        if (o.material) {
          o.material.envMapIntensity = 1.4;
          o.material.toneMapped = true;
        }
      }
    });
    const box = new THREE.Box3().setFromObject(c);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    c.scale.setScalar(targetSize / maxDim);
    const box2 = new THREE.Box3().setFromObject(c);
    const center = new THREE.Vector3();
    box2.getCenter(center);
    c.position.sub(center);
    return c;
  }, [scene, targetSize]);

  useEffect(() => {
    if (ref && typeof ref === "object" && ref.current && onReady) {
      onReady(ref.current);
    }
  }, [ref, onReady, cloned]);

  return (
    <group ref={ref} position={position} rotation={rotation} scale={scale}>
      <primitive object={cloned} />
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// DUST PARTICLES
// ═══════════════════════════════════════════════════════════
function DustParticles({ count = 400 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const progress = useScrollProgress();

  const { positions, velocities, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const blue = new THREE.Color(PALETTE.electricBlueSoft);
    const violet = new THREE.Color(PALETTE.violetSoft);
    let seed = 42;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rnd() - 0.5) * 30;
      pos[i * 3 + 1] = rnd() * 8;
      pos[i * 3 + 2] = (rnd() - 0.5) * 30;
      vel[i * 3] = (rnd() - 0.5) * 0.02;
      vel[i * 3 + 1] = rnd() * 0.015 + 0.005;
      vel[i * 3 + 2] = (rnd() - 0.5) * 0.02;
      const c = rnd() > 0.5 ? blue : violet;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, velocities: vel, colors: col };
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities[i * 3] + Math.sin(t + i) * 0.001;
      arr[i * 3 + 1] += velocities[i * 3 + 1];
      arr[i * 3 + 2] += velocities[i * 3 + 2];
      if (arr[i * 3 + 1] > 8) arr[i * 3 + 1] = 0;
      if (arr[i * 3] > 15) arr[i * 3] = -15;
      if (arr[i * 3] < -15) arr[i * 3] = 15;
      if (arr[i * 3 + 2] > 15) arr[i * 3 + 2] = -15;
      if (arr[i * 3 + 2] < -15) arr[i * 3 + 2] = 15;
    }
    posAttr.needsUpdate = true;

    pointsRef.current.rotation.y = t * 0.02;

    const mat = pointsRef.current.material as THREE.PointsMaterial;
    if (mat) mat.opacity = 0.4 + progress.current * 0.3;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ═══════════════════════════════════════════════════════════
// LENS FLARE
// ═══════════════════════════════════════════════════════════
function LensFlare() {
  const flareRef = useRef<THREE.Mesh>(null);
  const progress = useScrollProgress();

  useFrame((state) => {
    if (!flareRef.current) return;
    const t = state.clock.elapsedTime;
    const p = progress.current;
    flareRef.current.position.set(
      2.5 + Math.sin(t * 0.3) * 0.5,
      5.5 + Math.cos(t * 0.4) * 0.3,
      -18
    );
    const mat = flareRef.current.material as THREE.MeshBasicMaterial;
    if (mat) mat.opacity = 0.06 + p * 0.1 + Math.sin(t * 2) * 0.02;
    flareRef.current.lookAt(state.camera.position);
  });

  return (
    <mesh ref={flareRef}>
      <planeGeometry args={[0.7, 0.7]} />
      <meshBasicMaterial
        color={PALETTE.electricBlue}
        transparent
        opacity={0.1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ═══════════════════════════════════════════════════════════
// POSTPROCESSING
// ═══════════════════════════════════════════════════════════
function PostFX() {
  const progress = useScrollProgress();
  const chromaRef = useRef<any>(null);

  useFrame(() => {
    if (chromaRef.current) {
      const p = progress.current;
      const offset = chromaRef.current.offset;
      if (offset) {
        const intensity = 0.0004 + p * 0.0005;
        offset.x = intensity;
        offset.y = intensity;
      }
    }
  });

  return (
    <EffectComposer multisampling={4}>
      <Bloom intensity={0.35} luminanceThreshold={0.7} luminanceSmoothing={0.7} mipmapBlur radius={0.4} />
      <ChromaticAberration
        ref={chromaRef}
        offset={new THREE.Vector2(0.0004, 0.0004)}
        radialModulation={false}
        modulationOffset={0}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette eskil={false} offset={0.35} darkness={0.65} />
      <Noise opacity={0.02} blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  );
}

// ═══════════════════════════════════════════════════════════
// STUDIO ENVIRONMENT
// ═══════════════════════════════════════════════════════════
function StudioEnvironment() {
  const roomW = 24, roomD = 30, roomH = 6;
  const cityRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const buildings = useMemo(() => {
    const arr: any[] = [];
    let seed = 987;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < 70; i++) {
      const w = 0.6 + rnd() * 1.8, h = 2 + rnd() * 14, d = 0.6 + rnd() * 1.8;
      arr.push({ x: -30 + rnd() * 60, y: h / 2 - 3, z: -25 - rnd() * 40, w, h, d });
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (cityRef.current && !cityRef.current.userData.init) {
      buildings.forEach((b, i) => {
        dummy.position.set(b.x, b.y, b.z);
        dummy.scale.set(b.w, b.h, b.d);
        dummy.updateMatrix();
        cityRef.current!.setMatrixAt(i, dummy.matrix);
      });
      cityRef.current.instanceMatrix.needsUpdate = true;
      cityRef.current.userData.init = true;
    }
    if (cityRef.current) {
      const mat = cityRef.current.material as THREE.MeshStandardMaterial;
      if (mat) mat.emissiveIntensity = 0.55 + Math.sin(state.clock.elapsedTime * 0.4) * 0.08;
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[roomW, roomD]} />
        <meshStandardMaterial color="#070a16" roughness={0.25} metalness={0.9} />
      </mesh>
      <mesh position={[0, roomH / 2, -roomD / 2]} receiveShadow>
        <planeGeometry args={[roomW, roomH]} />
        <meshStandardMaterial color="#080b17" roughness={0.9} />
      </mesh>
      <mesh position={[0, roomH / 2, roomD / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[roomW, roomH]} />
        <meshStandardMaterial color="#080b17" roughness={0.9} />
      </mesh>
      <mesh position={[-roomW / 2, roomH / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[roomD, roomH]} />
        <meshStandardMaterial color="#070914" roughness={0.95} />
      </mesh>
      <mesh position={[roomW / 2, roomH / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[roomD, roomH]} />
        <meshStandardMaterial color="#070914" roughness={0.95} />
      </mesh>
      <mesh position={[roomW / 2 - 0.02, 2.6, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[roomD * 0.7, roomH * 0.6]} />
        <meshPhysicalMaterial color="#04050c" roughness={0.05} metalness={0.4} transmission={0.15} transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, roomH, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roomW, roomD]} />
        <meshStandardMaterial color="#050714" roughness={1} />
      </mesh>
      <instancedMesh ref={cityRef} args={[undefined, undefined, buildings.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0a0f1e" emissive={PALETTE.electricBlue} emissiveIntensity={0.65} roughness={0.75} />
      </instancedMesh>
      {[-6, -3, 0, 3, 6].map((x, i) => (
        <mesh key={i} position={[x, 3.8, -roomD / 2 + 0.06]}>
          <boxGeometry args={[2.4, 3, 0.12]} />
          <meshStandardMaterial color="#05080f" roughness={1} />
        </mesh>
      ))}
      <group position={[-4.5, 0, -3]}>
        <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
          <boxGeometry args={[3, 0.08, 1.4]} />
          <meshStandardMaterial color="#0f1220" roughness={0.55} metalness={0.35} />
        </mesh>
        {[[-1.35, 0.45, -0.6], [1.35, 0.45, -0.6], [-1.35, 0.45, 0.6], [1.35, 0.45, 0.6]].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]} castShadow>
            <boxGeometry args={[0.08, 0.9, 0.08]} />
            <meshStandardMaterial color="#070a14" roughness={0.7} metalness={0.5} />
          </mesh>
        ))}
      </group>
      <group position={[5.5, 0, 2]}>
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[0.6, 0.06, 0.6]} />
          <meshStandardMaterial color="#0f0a1c" roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.05, -0.3]} castShadow>
          <boxGeometry args={[0.6, 0.9, 0.06]} />
          <meshStandardMaterial color="#0f0a1c" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// STUDIO LIGHTS
// ═══════════════════════════════════════════════════════════
function StudioLights() {
  const progress = useScrollProgress();
  const ambient = useRef<THREE.AmbientLight>(null);
  const keyLight = useRef<THREE.SpotLight>(null);
  const fillA = useRef<THREE.SpotLight>(null);
  const fillB = useRef<THREE.SpotLight>(null);
  const rim = useRef<THREE.PointLight>(null);
  const city = useRef<THREE.DirectionalLight>(null);

  useFrame((state) => {
    const p = progress.current;
    const t = state.clock.elapsedTime;
    if (ambient.current) ambient.current.intensity = 0.35 + Math.max(0, p - 0.05) * 0.3;
    if (keyLight.current) {
      const flicker = Math.sin(t * 8) * 0.02;
      keyLight.current.intensity = (12 + THREE.MathUtils.clamp((p - 0.1) / 0.15, 0, 1) * 42) * (1 + flicker);
    }
    if (fillA.current) fillA.current.intensity = 8 + THREE.MathUtils.clamp((p - 0.15) / 0.15, 0, 1) * 40;
    if (fillB.current) fillB.current.intensity = 8 + THREE.MathUtils.clamp((p - 0.2) / 0.15, 0, 1) * 36;
    if (rim.current) rim.current.intensity = 2 + THREE.MathUtils.clamp((p - 0.25) / 0.15, 0, 1) * 10;
    if (city.current) city.current.intensity = 0.4 + THREE.MathUtils.clamp((p - 0.1) / 0.3, 0, 1) * 1.2;
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0.35} color="#3a4270" />
      <spotLight ref={keyLight} position={[2.5, 5.5, 3]} angle={0.7} penumbra={0.7} intensity={12} distance={40} decay={1.8} color={PALETTE.keyWarm} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0003} />
      <spotLight ref={fillA} position={[-6, 4, 1]} angle={0.9} penumbra={1} intensity={8} distance={30} decay={1.8} color={PALETTE.violet} />
      <spotLight ref={fillB} position={[7, 4.5, -3]} angle={0.8} penumbra={1} intensity={8} distance={32} decay={1.8} color={PALETTE.electricBlue} />
      <pointLight ref={rim} position={[0, 3, -8]} intensity={2} distance={22} decay={1.8} color={PALETTE.rim} />
      <directionalLight ref={city} position={[12, 8, 0]} intensity={0.4} color={PALETTE.cityCool} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// CAMERA RIG
// ═══════════════════════════════════════════════════════════
function CameraRig() {
  const progress = useScrollProgress();
  const { camera, pointer } = useThree();
  const lookAt = useRef(new THREE.Vector3(0, 1.4, 0));
  const lastP = useRef(0);
  const shakeAmp = useRef(0);

  const keyframes = useRef([
    { t: 0.00, pos: new THREE.Vector3(0, 1.8, 8),      look: new THREE.Vector3(0, 1.4, 0) },
    { t: 0.12, pos: new THREE.Vector3(0, 1.7, 6.5),    look: new THREE.Vector3(0, 1.4, 0) },
    { t: 0.22, pos: new THREE.Vector3(0, 1.6, 5),      look: new THREE.Vector3(0, 1.4, 0) },
    { t: 0.32, pos: new THREE.Vector3(0, 1.6, 3.5),    look: new THREE.Vector3(0, 1.5, 0) },
    { t: 0.42, pos: new THREE.Vector3(1, 1.6, 2.5),    look: new THREE.Vector3(-1.5, 1.5, -1) },
    { t: 0.52, pos: new THREE.Vector3(-1, 1.7, 1.5),   look: new THREE.Vector3(2, 1.8, 0) },
    { t: 0.62, pos: new THREE.Vector3(0.5, 1.5, 0.5),  look: new THREE.Vector3(-2, 1.4, -4) },
    { t: 0.72, pos: new THREE.Vector3(0, 1.6, -1),     look: new THREE.Vector3(0, 1.5, -5) },
    { t: 0.82, pos: new THREE.Vector3(0, 1.7, -3),     look: new THREE.Vector3(0, 1.6, -8) },
    { t: 0.92, pos: new THREE.Vector3(0, 1.7, -5),     look: new THREE.Vector3(0, 1.6, -12) },
    { t: 1.00, pos: new THREE.Vector3(0, 1.7, -7),     look: new THREE.Vector3(0, 1.6, -14) },
  ]);

  const tmpPos = useRef(new THREE.Vector3());
  const tmpLook = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const p = progress.current;
    const kf = keyframes.current;
    let a = kf[0], b = kf[kf.length - 1];
    for (let i = 0; i < kf.length - 1; i++) {
      if (p >= kf[i].t && p <= kf[i + 1].t) { a = kf[i]; b = kf[i + 1]; break; }
    }
    const localT = (p - a.t) / Math.max(0.0001, b.t - a.t);
    const eased = localT * localT * (3 - 2 * localT);

    const diff = Math.abs(p - lastP.current);
    if (diff > 0.02) shakeAmp.current = Math.min(0.04, diff * 0.5);
    lastP.current = p;
    shakeAmp.current *= 0.92;

    tmpPos.current.lerpVectors(a.pos, b.pos, eased);
    camera.position.lerp(tmpPos.current, 1 - Math.pow(0.001, delta));
    tmpLook.current.lerpVectors(a.look, b.look, eased);
    lookAt.current.lerp(tmpLook.current, 1 - Math.pow(0.001, delta));

    const mx = pointer.x * 0.35, my = pointer.y * 0.25;
    camera.lookAt(lookAt.current.x + mx, lookAt.current.y + my, lookAt.current.z);

    const t = performance.now() * 0.0005;
    camera.position.y += Math.sin(t) * 0.0015 + (Math.random() - 0.5) * shakeAmp.current;
    camera.position.x += Math.cos(t * 1.3) * 0.0015 + (Math.random() - 0.5) * shakeAmp.current;

    const targetFov = 42 - p * 8;
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov += (targetFov - cam.fov) * 0.05;
    cam.updateProjectionMatrix();
  });

  return null;
}

// ═══════════════════════════════════════════════════════════
// FLOAT MOVEMENT
// ═══════════════════════════════════════════════════════════
function useFloatMovement(
  groupRef: React.RefObject<THREE.Group | null>,
  opts: {
    baseX: number; baseY: number; baseZ: number;
    rangeX?: number; rangeY?: number; rangeZ?: number;
    speedX?: number; speedY?: number;
    phaseX?: number; phaseY?: number;
    visibleFrom: number; visibleTo: number;
    fadeInAt?: number; fadeOutAt?: number;
    maxScale?: number;
  }
) {
  const progress = useScrollProgress();

  useFrame((state) => {
    if (!groupRef.current) return;
    const p = progress.current;
    const t = state.clock.elapsedTime;

    const {
      baseX, baseY, baseZ,
      rangeX = 0.15, rangeY = 0.08, rangeZ = 0,
      speedX = 0.5, speedY = 0.7,
      phaseX = 0, phaseY = 1.3,
      visibleFrom, visibleTo,
      fadeInAt = 0.08, fadeOutAt = 0.08,
      maxScale = 1.35,
    } = opts;

    const fadeIn = THREE.MathUtils.smoothstep(p, visibleFrom - fadeInAt, visibleFrom);
    const fadeOut = 1 - THREE.MathUtils.smoothstep(p, visibleTo, visibleTo + fadeOutAt);
    const visibility = Math.max(0, Math.min(1, fadeIn * fadeOut));

    const x = baseX + Math.sin(t * speedX + phaseX) * rangeX;
    const y = baseY + Math.cos(t * speedY + phaseY) * rangeY;
    const z = baseZ + (p * rangeZ);

    groupRef.current.position.set(x, y, z);

    groupRef.current.rotation.y = Math.sin(t * 0.35) * 0.35 + p * 0.6;
    groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.06;
    groupRef.current.rotation.z = Math.sin(t * 0.4) * 0.04;

    const scale = visibility * (1.05 + visibility * (maxScale - 1.05));
    groupRef.current.scale.setScalar(scale);
  });
}

// ═══════════════════════════════════════════════════════════
// MODELS
// ═══════════════════════════════════════════════════════════
function CameraModel() {
  const group = useRef<THREE.Group>(null);
  useFloatMovement(group, {
    baseX: 0, baseY: 1.6, baseZ: 0.5,
    rangeX: 0.35, rangeY: 0.15, rangeZ: 4,
    speedX: 0.4, speedY: 0.6, phaseX: 0, phaseY: 1.2,
    visibleFrom: 0.03, visibleTo: 0.65,
    fadeInAt: 0.08, fadeOutAt: 0.08, maxScale: 1.5,
  });
  return (
    <>
      <GLTFModel ref={group} url="/models/camera.glb" targetSize={2.1} position={[0, 1.6, 0.5]} />
      <pointLight position={[0, 2.2, 2]} intensity={4} distance={8} decay={2} color="#a8c0ff" />
    </>
  );
}
useGLTF.preload("/models/camera.glb");

function SoftboxModel() {
  const group = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const progress = useScrollProgress();

  const onReady = (g: THREE.Group) => {
    g.traverse((o: any) => {
      if (o.isMesh && o.material) {
        const n = o.name.toLowerCase();
        if (n.includes("screen") || n.includes("panel") || n.includes("diffus") || n.includes("light") || n.includes("box") || n.includes("front")) {
          if (o.material.emissive) {
            o.material.emissive = new THREE.Color(PALETTE.electricBlue);
            o.material.emissiveIntensity = 2.2;
          }
          o.material.toneMapped = false;
        }
        if (n.includes("frame") || n.includes("edge") || n.includes("rod") || n.includes("stand") || n.includes("back")) {
          if (o.material.emissive) {
            o.material.emissive = new THREE.Color(PALETTE.violet);
            o.material.emissiveIntensity = 0.6;
          }
        }
      }
    });
  };

  useFrame((state) => {
    if (!group.current) return;
    const p = progress.current, t = state.clock.elapsedTime;
    const on1 = THREE.MathUtils.clamp((p - 0.02) / 0.1, 0, 1);
    group.current.position.set(-3.8, 2.4, 2.4);
    group.current.rotation.set(0.25, 0.6, 0);
    group.current.scale.setScalar(1.1 + on1 * 0.6);
    if (lightRef.current) lightRef.current.intensity = on1 * 26 + Math.sin(t * 30) * 0.2 * on1;
  });

  return (
    <>
      <GLTFModel ref={group} url="/models/softbox.glb" targetSize={3.0} position={[-3.8, 2.4, 2.4]} rotation={[0.25, 0.6, 0]} onReady={onReady} />
      <pointLight ref={lightRef} position={[-3.8, 2.4, 2.4]} intensity={0} distance={24} decay={1.8} color={PALETTE.electricBlue} />
    </>
  );
}
useGLTF.preload("/models/softbox.glb");

function PhoneModel() {
  const group = useRef<THREE.Group>(null);
  const progress = useScrollProgress();

  useFrame((state) => {
    if (!group.current) return;
    const p = progress.current, t = state.clock.elapsedTime;
    const visibility = THREE.MathUtils.clamp((p - 0.24) / 0.1, 0, 1);
    const disappear = 1 - THREE.MathUtils.clamp((p - 0.5) / 0.1, 0, 1);
    group.current.position.set(-4.2, 1.6 + Math.sin(t * 1.2) * 0.1, -1.2);
    group.current.rotation.y = 0.3 + Math.sin(t * 0.5) * 0.18;
    group.current.rotation.z = Math.sin(t * 0.7) * 0.06;
    group.current.rotation.x = Math.sin(t * 0.4) * 0.07;
    group.current.scale.setScalar(visibility * disappear * 1.25);
  });

  return (
    <>
      <GLTFModel ref={group} url="/models/phone.glb" targetSize={1.1} position={[-4.2, 1.6, -1.2]} />
      <pointLight position={[-4.2, 2, 0.5]} intensity={3} distance={6} decay={2} color="#a8c0ff" />
    </>
  );
}
useGLTF.preload("/models/phone.glb");

function MonitorModel() {
  const group = useRef<THREE.Group>(null);
  const screenMat = useRef<THREE.MeshStandardMaterial | null>(null);
  const progress = useScrollProgress();

  const onReady = (g: THREE.Group) => {
    g.traverse((o: any) => {
      if (o.isMesh && o.material) {
        const n = o.name.toLowerCase();
        if (n.includes("screen") || n.includes("display") || n.includes("lcd")) {
          if (o.material.emissive) {
            o.material.emissive = new THREE.Color(PALETTE.electricBlue);
            o.material.emissiveIntensity = 1.2;
            screenMat.current = o.material;
          }
        }
      }
    });
  };

  useFrame((state) => {
    if (!group.current) return;
    const p = progress.current, t = state.clock.elapsedTime;
    const visibility = THREE.MathUtils.clamp((p - 0.46) / 0.08, 0, 1);
    const disappear = 1 - THREE.MathUtils.clamp((p - 0.68) / 0.08, 0, 1);
    group.current.position.set(-2.4, 1.4, -3.5);
    group.current.rotation.y = 0.5;
    group.current.rotation.x = -0.05 + Math.sin(t * 0.4) * 0.02;
    group.current.scale.setScalar(visibility * disappear * 1.3);
    if (screenMat.current) {
      screenMat.current.emissiveIntensity = 0.8 + Math.sin(t * 2) * 0.2 + visibility * 1;
    }
  });

  return (
    <>
      <GLTFModel ref={group} url="/models/monitor.glb" targetSize={1.8} position={[-2.4, 1.4, -3.5]} rotation={[0, 0.5, 0]} onReady={onReady} />
      <pointLight position={[-2.4, 2, -2.5]} intensity={3} distance={8} decay={2} color={PALETTE.electricBlue} />
    </>
  );
}
useGLTF.preload("/models/monitor.glb");

function DroneModel() {
  const group = useRef<THREE.Group>(null);
  const rotorsRef = useRef<THREE.Object3D[]>([]);

  const onReady = (g: THREE.Group) => {
    rotorsRef.current = [];
    g.traverse((o) => {
      const n = o.name.toLowerCase();
      if (
        n.includes("rotor") || n.includes("prop") || n.includes("blade") ||
        n.includes("propeller") || n.includes("fan") || n.includes("wing")
      ) {
        rotorsRef.current.push(o);
      }
    });
  };

  useFloatMovement(group, {
    baseX: 2.6, baseY: 2, baseZ: -1,
    rangeX: 0.3, rangeY: 0.15, rangeZ: -3.5,
    speedX: 0.55, speedY: 0.65, phaseX: 2.1, phaseY: 0.8,
    visibleFrom: 0.12, visibleTo: 0.88,
    fadeInAt: 0.08, fadeOutAt: 0.08, maxScale: 1.55,
  });

  useFrame((_, delta) => {
    rotorsRef.current.forEach((r, i) => {
      r.rotation.y += delta * 42 * (i % 2 === 0 ? 1 : -1);
    });
  });

  return (
    <>
      <GLTFModel ref={group} url="/models/drone.glb" targetSize={1.9} position={[2.6, 2, -1]} onReady={onReady} />
      <pointLight position={[2.6, 2.8, 0.5]} intensity={4} distance={9} decay={2} color="#c0d0ff" />
    </>
  );
}
useGLTF.preload("/models/drone.glb");

// ═══════════════════════════════════════════════════════════
// LENS TRANSITION
// ═══════════════════════════════════════════════════════════
function LensTransition() {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const progress = useScrollProgress();

  useFrame(({ camera }) => {
    if (!meshRef.current || !matRef.current) return;
    const p = progress.current;
    meshRef.current.position.copy(camera.position);
    meshRef.current.quaternion.copy(camera.quaternion);
    meshRef.current.translateZ(-0.5);
    matRef.current.uniforms.uProgress.value = THREE.MathUtils.clamp((p - 0.68) / 0.14, 0, 1);
    matRef.current.uniforms.uTime.value = performance.now() * 0.001;
  });

  return (
    <mesh ref={meshRef} renderOrder={999}>
      <planeGeometry args={[3, 3]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthTest={false}
        depthWrite={false}
        uniforms={{ uProgress: { value: 0 }, uTime: { value: 0 } }}
        vertexShader={`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
        fragmentShader={`
          varying vec2 vUv;
          uniform float uProgress;
          uniform float uTime;
          void main(){
            vec2 c=vUv-0.5;
            float d=length(c);
            float r=uProgress*0.85;
            float edge=smoothstep(r,r-0.02,d);
            float ring=smoothstep(r+0.03,r,d)*(1.0-smoothstep(r,r-0.03,d));
            vec3 blue = vec3(0.31, 0.48, 1.0);
            vec3 violet = vec3(0.55, 0.36, 0.96);
            vec3 col = mix(blue, violet, ring) * ring * 0.9;
            float pulse = 0.65 + sin(uTime * 8.0) * 0.12;
            col *= pulse;
            col = mix(col, vec3(0.0), edge);
            float a = max(edge, ring * 0.75);
            gl_FragColor = vec4(col, a);
          }
        `}
      />
    </mesh>
  );
}

// ═══════════════════════════════════════════════════════════
// EXPERIENCE
// ═══════════════════════════════════════════════════════════
function Experience({ ready, onStartProject }: { ready: boolean; onStartProject: () => void }) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => setIsMobile(window.matchMedia("(max-width: 768px)").matches), []);
  if (!ready) return null;

  return (
    <SmoothScrollProvider>
      <div style={{ height: "1400vh" }} aria-hidden />
      <div className="fixed inset-0 z-0">
        <Canvas
          dpr={isMobile ? [1, 1] : [1, 2]}
          shadows={!isMobile}
          gl={{
            antialias: !isMobile,
            alpha: true,
            powerPreference: isMobile ? "low-power" : "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: isMobile ? 0.95 : 1.15,
          }}
          camera={{ position: [0, 1.7, 8], fov: isMobile ? 48 : 42, near: 0.1, far: 200 }}
          onCreated={({ gl, scene }) => {
            gl.setClearColor(0x000000, 0);
            scene.fog = new THREE.FogExp2(PALETTE.baseFog, isMobile ? 0.012 : 0.008);
          }}
        >
          <Suspense fallback={null}>
            <StudioEnvironment />
            <StudioLights />
            <CameraModel />
            {!isMobile && <SoftboxModel />}
            {!isMobile && <PhoneModel />}
            {!isMobile && <MonitorModel />}
            {!isMobile && <DroneModel />}
            <DustParticles count={isMobile ? 40 : 400} />
            {!isMobile && <LensFlare />}
            {!isMobile && <LensTransition />}
            <CameraRig />
            <AdaptiveDpr pixelated />
            {!isMobile && <PostFX />}
          </Suspense>
        </Canvas>
      </div>

      <AmbientBackground />

      <AnalyticsBars />
      <KPIWidgets />
      <GrowthLine />
      <HashtagCloud />
      <TrafficDots />
      <LiveFollowerCounter />
      <CampaignTicker />

      <ServicesDonut />
      <ComparisonBars />
      <RegionDots />
      <RetentionCurve />
      <NumberParticles />

      <FloatingSocialIcons />
      <SceneTransitionWipe />
      <OverlaySections onStartProject={onStartProject} />
      <HUDOverlay />
      <SideNav />
      <BottomBar />
      <ProgressBar />
      <SoundToggle />
    </SmoothScrollProvider>
  );
}

// ═══════════════════════════════════════════════════════════
// TEXT SCRAMBLE
// ═══════════════════════════════════════════════════════════
const SCRAMBLE_CHARS = "!<>-_\\/[]{}—=+*^?#________";

function useTextScramble(text: string, trigger: boolean) {
  const [display, setDisplay] = useState(text);
  const frameRef = useRef(0);
  const queueRef = useRef<{ from: string; to: string; start: number; end: number; char?: string }[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!trigger) return;
    const oldText = text;
    const length = Math.max(oldText.length, text.length);
    const queue: any[] = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || "";
      const to = text[i] || "";
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      queue.push({ from, to, start, end });
    }
    queueRef.current = queue;
    frameRef.current = 0;

    const update = () => {
      let output = "";
      let complete = 0;
      for (let i = 0; i < queue.length; i++) {
        const { from, to, start, end } = queue[i];
        let char = "";
        if (frameRef.current >= end) {
          complete++;
          char = to;
        } else if (frameRef.current >= start) {
          if (!queue[i].char || Math.random() < 0.28) {
            queue[i].char = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          }
          char = queue[i].char!;
        } else {
          char = from;
        }
        output += `<span>${char}</span>`;
      }
      setDisplay(output);
      if (complete === queue.length) return;
      frameRef.current++;
      rafRef.current = requestAnimationFrame(update);
    };
    update();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [text, trigger]);

  return display;
}

function ScrambleText({ text, className = "" }: { text: string; className?: string }) {
  const [hover, setHover] = useState(false);
  const display = useTextScramble(text, hover);

  return (
    <span
      className={className}
      onMouseEnter={() => setHover(true)}
      dangerouslySetInnerHTML={{ __html: display }}
    />
  );
}

// ═══════════════════════════════════════════════════════════
// MAGNETIC BUTTON
// ═══════════════════════════════════════════════════════════
function MagneticButton({
  children,
  className = "",
  strength = 0.35,
  ...props
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
} & React.ComponentPropsWithoutRef<"button">) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { damping: 15, stiffness: 150 });
  const sy = useSpring(y, { damping: 15, stiffness: 150 });

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = e.clientY - rect.top - rect.height / 2;
    x.set(mx * strength);
    y.set(my * strength);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      className={className}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════
// SCENE TRANSITION WIPE
// ═══════════════════════════════════════════════════════════
function SceneTransitionWipe() {
  const p = useScrollState();
  const [flash, setFlash] = useState(false);
  const lastScene = useRef(0);

  useEffect(() => {
    const idx = SCENES.findIndex((s) => p >= s.range[0] && p <= s.range[1]);
    if (idx !== -1 && idx !== lastScene.current) {
      lastScene.current = idx;
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 500);
      return () => clearTimeout(timer);
    }
  }, [p]);

  return (
    <AnimatePresence>
      {flash && (
        <motion.div
          initial={{ opacity: 0.35, x: "-100%" }}
          animate={{ opacity: 0, x: "100%" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[14] pointer-events-none overflow-hidden"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(79,123,255,0.4) 45%, rgba(139,92,246,0.5) 55%, transparent 100%)",
            mixBlendMode: "screen",
          }}
        />
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════
// SOUND TOGGLE
// ═══════════════════════════════════════════════════════════
function SoundToggle() {
  const [on, setOn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (on) {
      try {
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AC) return;
        const ctx = new AC();
        ctxRef.current = ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 55;
        gain.gain.value = 0.02;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        oscRef.current = osc;
        gainRef.current = gain;
      } catch {}
    } else {
      try {
        oscRef.current?.stop();
        ctxRef.current?.close();
      } catch {}
      oscRef.current = null;
      ctxRef.current = null;
    }
    return () => {
      try {
        oscRef.current?.stop();
        ctxRef.current?.close();
      } catch {}
    };
  }, [on, mounted]);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setOn(!on)}
      data-hover
      aria-label={on ? "Mute ambient sound" : "Play ambient sound"}
      className="fixed top-20 md:top-24 right-3 md:right-10 z-[255] flex items-center gap-2 px-2.5 md:px-3 py-1.5 md:py-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-md hover:border-amber/50 transition-colors"
    >
      <div className="flex items-end gap-[2px] h-3">
        {[1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            className="block w-[2px] bg-amber"
            animate={{ height: on ? [3, 10, 5, 12, 3] : 3 }}
            transition={{ duration: 0.9 + i * 0.15, repeat: on ? Infinity : 0, ease: "easeInOut" }}
            style={{ height: 3, boxShadow: on ? "0 0 6px #4f7bff" : "none" }}
          />
        ))}
      </div>
      <span className="text-[8px] md:text-[9px] font-bold tracking-[2px] text-white/60">
        {on ? "SOUND ON" : "SOUND OFF"}
      </span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// SOCIAL ICONS
// ═══════════════════════════════════════════════════════════
function InstagramIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M14 8.5V7c0-.83.67-1.5 1.5-1.5H17V2.5h-2.5A4.5 4.5 0 0 0 10 7v1.5H8V12h2v9.5h4V12h2.7l.5-3.5H14Z" fill="currentColor" />
    </svg>
  );
}

function YouTubeIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M21.6 7.2s-.2-1.4-.8-2c-.8-.8-1.7-.8-2.1-.9C16.8 4.2 12 4.2 12 4.2h-.01s-4.79 0-6.69.1c-.4.05-1.3.05-2.1.9-.6.6-.8 2-.8 2S2.2 8.9 2.2 10.5v1.5c0 1.6.2 3.3.2 3.3s.2 1.4.8 2c.8.8 1.8.8 2.2.9 1.6.15 6.6.2 6.6.2s4.8 0 6.7-.1c.4-.05 1.3-.05 2.1-.9.6-.6.8-2 .8-2s.2-1.7.2-3.3v-1.5c0-1.6-.2-3.3-.2-3.3ZM10 14.5v-5.6l4.8 2.8-4.8 2.8Z" fill="currentColor" />
    </svg>
  );
}

function XIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" fill="currentColor" />
    </svg>
  );
}

function HeartIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 21s-7.5-4.35-9.5-9.05C1.1 8.55 3.2 5 6.5 5c2 0 3.5 1.1 4.5 2.4C12 6.1 13.5 5 15.5 5c3.3 0 5.4 3.55 4 6.95C19.5 16.65 12 21 12 21Z" fill="currentColor" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════
// FLOATING SOCIAL ICONS
// ═══════════════════════════════════════════════════════════
type FloatingIcon = {
  id: string;
  Icon: (props: { className?: string }) => React.ReactElement;
  color: string;
  glow: string;
  startX: number;
  startY: number;
  size: number;
  duration: number;
  delay: number;
  rotate: number;
  url: string;
};

const FLOATING_ICONS: FloatingIcon[] = [
  { id: "ig-1", Icon: InstagramIcon, color: "#d946ef", glow: "rgba(217,70,239,0.6)", startX: 12, startY: 22, size: 46, duration: 14, delay: 0, rotate: -8, url: SOCIAL_LINKS.instagram },
  { id: "fb-1", Icon: FacebookIcon,  color: "#4f7bff", glow: "rgba(79,123,255,0.6)", startX: 84, startY: 18, size: 42, duration: 16, delay: 1.2, rotate: 10, url: SOCIAL_LINKS.facebook },
  { id: "yt-1", Icon: YouTubeIcon,   color: "#f43f5e", glow: "rgba(244,63,94,0.6)",  startX: 88, startY: 62, size: 44, duration: 15, delay: 0.6, rotate: -12, url: SOCIAL_LINKS.youtube },
  { id: "x-1",  Icon: XIcon,         color: "#ffffff", glow: "rgba(255,255,255,0.45)",startX: 14, startY: 72, size: 38, duration: 17, delay: 1.8, rotate: 6, url: SOCIAL_LINKS.x },
  { id: "ig-2", Icon: InstagramIcon, color: "#d946ef", glow: "rgba(217,70,239,0.5)", startX: 8,  startY: 48, size: 34, duration: 18, delay: 2.4, rotate: 18, url: SOCIAL_LINKS.instagram },
  { id: "fb-2", Icon: FacebookIcon,  color: "#4f7bff", glow: "rgba(79,123,255,0.5)", startX: 78, startY: 84, size: 36, duration: 15, delay: 1.0, rotate: -20, url: SOCIAL_LINKS.facebook },
  { id: "heart-1", Icon: HeartIcon,  color: "#f43f5e", glow: "rgba(244,63,94,0.55)", startX: 26, startY: 14, size: 32, duration: 13, delay: 0.4, rotate: -6, url: SOCIAL_LINKS.instagram },
  { id: "heart-2", Icon: HeartIcon,  color: "#f43f5e", glow: "rgba(244,63,94,0.5)",  startX: 70, startY: 42, size: 28, duration: 14, delay: 2.0, rotate: 14, url: SOCIAL_LINKS.instagram },
];

function FloatingSocialIcons() {
  const p = useScrollState();
  const visible = p >= 0.78 && p <= 0.94;
  const fade = visible ? Math.min(1, Math.max(0, (p - 0.78) / 0.03) * Math.max(0, (0.94 - p) / 0.03)) : 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: fade }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[12] pointer-events-none hidden md:block"
        >
          {FLOATING_ICONS.map((item) => (
            <FloatingIconItem key={item.id} {...item} />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FloatingIconItem({ Icon, color, glow, startX, startY, size, duration, delay, rotate, url }: FloatingIcon) {
  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noreferrer"
      data-hover
      className="pointer-events-auto absolute flex items-center justify-center rounded-2xl border border-white/10 backdrop-blur-md"
      style={{
        left: `${startX}%`,
        top: `${startY}%`,
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color}22, transparent)`,
        color,
        boxShadow: `0 0 24px ${glow}, inset 0 0 0 1px ${color}33`,
        rotate: `${rotate}deg`,
      }}
      animate={{
        y: [0, -18, 0, 14, 0],
        x: [0, 10, -8, 6, 0],
        rotate: [rotate, rotate + 8, rotate - 6, rotate + 4, rotate],
      }}
      transition={{ duration, delay, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
      whileHover={{ scale: 1.25, rotate: 0 }}
    >
      <Icon className="w-1/2 h-1/2" />
    </motion.a>
  );
}

// ═══════════════════════════════════════════════════════════
// HUD OVERLAY
// ═══════════════════════════════════════════════════════════
function HUDOverlay() {
  const [time, setTime] = useState("00:00:00:00");

  useEffect(() => {
    const int = setInterval(() => {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      const s = String(d.getSeconds()).padStart(2, "0");
      const f = String(Math.floor(Math.random() * 24)).padStart(2, "0");
      setTime(`${h}:${m}:${s}:${f}`);
    }, 42);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="fixed inset-0 z-20 pointer-events-none hidden md:block">
      <div className="absolute top-20 left-8 w-10 h-10 border-l border-t border-amber/50" />
      <div className="absolute top-20 right-8 w-10 h-10 border-r border-t border-amber/50" />
      <div className="absolute bottom-28 left-8 w-10 h-10 border-l border-b border-amber/50" />
      <div className="absolute bottom-28 right-8 w-10 h-10 border-r border-b border-amber/50" />

      <div className="absolute top-24 left-20 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#f43f5e] shadow-[0_0_12px_#f43f5e] animate-[pulseDot_1.4s_ease-in-out_infinite]" />
        <span className="text-[#f43f5e] text-[10px] font-bold tracking-[4px]">REC</span>
      </div>

      <div className="absolute top-24 right-20 flex flex-col items-end">
        <span className="text-[9px] text-white/40 font-bold tracking-[3px]">TIMECODE</span>
        <span className="text-amber text-xs font-mono tabular-nums tracking-wider">{time}</span>
      </div>

      <div className="absolute bottom-32 left-20 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-amber shadow-[0_0_6px_#4f7bff]" />
          <span className="text-white/60 text-[9px] font-bold tracking-[3px]">DMV · 001</span>
        </div>
        <span className="text-white/40 text-[8px] font-mono tracking-widest">4K · 24FPS · ƒ1.8</span>
      </div>

      <div className="absolute bottom-32 right-20 flex flex-col items-end gap-1">
        <span className="text-white/60 text-[9px] font-bold tracking-[3px]">ISO 800</span>
        <span className="text-white/40 text-[8px] font-mono tracking-widest">1/48 · WB 5600K</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SIDE NAV
// ═══════════════════════════════════════════════════════════
function SideNav() {
  const p = useScrollState();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const activeIdx = SCENES.findIndex((s) => p >= s.range[0] && p <= s.range[1]);
  const currentActive = activeIdx === -1 ? (p < SCENES[0].range[0] ? 0 : SCENES.length - 1) : activeIdx;

  const goTo = useCallback((idx: number) => {
    const max = document.body.scrollHeight - window.innerHeight;
    const mid = (SCENES[idx].range[0] + SCENES[idx].range[1]) / 2;
    window.scrollTo({ top: mid * max, behavior: "smooth" });
  }, []);

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col items-end gap-3">
      {SCENES.map((scene, i) => {
        const isActive = i === currentActive;
        const isHover = i === hoverIdx;
        return (
          <button
            key={scene.id}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
            onClick={() => goTo(i)}
            className="flex items-center gap-3 group"
            aria-label={scene.title}
          >
            <span
              className="text-[9px] font-bold tracking-[2px] uppercase transition-all duration-300"
              style={{
                opacity: isActive || isHover ? 1 : 0,
                transform: isActive || isHover ? "translateX(0)" : "translateX(8px)",
                color: isActive ? "#4f7bff" : "rgba(255,255,255,0.6)",
              }}
            >
              {scene.chapter} · {scene.title}
            </span>
            <div
              className="rounded-full transition-all duration-300 relative"
              style={{
                width: isActive ? 28 : 6,
                height: isActive ? 3 : 6,
                background: isActive ? "#4f7bff" : "rgba(255,255,255,0.2)",
                boxShadow: isActive ? "0 0 14px rgba(79,123,255,0.95)" : "none",
              }}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-full border border-amber animate-ping" style={{ animationDuration: "2s" }} />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// BOTTOM BAR
// ═══════════════════════════════════════════════════════════
function BottomBar() {
  const p = useScrollState();
  const activeIdx = SCENES.findIndex((s) => p >= s.range[0] && p <= s.range[1]);
  const current = activeIdx === -1 ? 0 : activeIdx;
  const scene = SCENES[current];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 hidden md:block pointer-events-none">
      <div
        className="border-t border-white/5 bg-black/40 backdrop-blur-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="px-8 py-3 flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber shadow-[0_0_10px_#4f7bff]" />
              <span className="text-amber text-[9px] font-bold tracking-[3px]">CH {scene.chapter}</span>
            </div>
            <span className="text-white text-[10px] font-bold tracking-[3px]">{scene.title.toUpperCase()}</span>
            <span className="text-white/30 text-[9px]">·</span>
            <span className="text-white/50 text-[9px] tracking-[2px]">{scene.subtitle.toUpperCase()}</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative overflow-hidden w-[220px] hidden lg:block">
              <div className="flex whitespace-nowrap animate-marquee">
                <span className="text-white/30 text-[9px] tracking-[4px] font-bold pr-8">WE MADE VIBES · WE CAPTURE · WE GROW ·</span>
                <span className="text-white/30 text-[9px] tracking-[4px] font-bold pr-8">WE MADE VIBES · WE CAPTURE · WE GROW ·</span>
              </div>
            </div>
            <span className="text-amber text-[11px] font-black tabular-nums tracking-wider">
              {String(current + 1).padStart(2, "0")} / {String(TOTAL_SCENES).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════════════════════════
function ProgressBar() {
  const p = useScrollState();
  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[260] bg-white/5">
      <div
        className="h-full shadow-[0_0_15px_#4f7bff]"
        style={{
          width: `${p * 100}%`,
          background: "linear-gradient(90deg, #4f7bff 0%, #8b5cf6 60%, #a78bfa 100%)",
          transition: "width 0.15s linear",
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SPLIT TEXT
// ═══════════════════════════════════════════════════════════
function SplitText({ text, className = "", delay = 0, stagger = 0.08 }: { text: string; className?: string; delay?: number; stagger?: number }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, wi) => (
        <span key={wi} className="inline-block overflow-hidden align-bottom">
          <span className="inline-block" style={{ animation: `revealWord 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay + wi * stagger}s both` }}>
            {word}
          </span>
          {wi < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// ANIMATED COUNTER
// ═══════════════════════════════════════════════════════════
function AnimatedCounter({ target, duration = 1.6 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) setStarted(true);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    let raf: number;
    const loop = (now: number) => {
      const elapsed = (now - start) / 1000;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      setValue(Math.floor(eased * target));
      if (t < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [started, target, duration]);

  return <span ref={ref}>{value}</span>;
}

// ═══════════════════════════════════════════════════════════
// OVERLAYS — client logos now live inside the DM Clients overlay
// ═══════════════════════════════════════════════════════════
function OverlaySections({ onStartProject }: { onStartProject: () => void }) {
  const p = useScrollState();
  const show = (from: number, to: number) => (p >= from && p <= to ? 1 : 0);

  return (
    <div className="fixed inset-0 z-10 pointer-events-none">
      <Overlay show={show(0, 0.11)} align="bottom-left">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-[1px] bg-[#f43f5e] shadow-[0_0_8px_#f43f5e]" />
          <span className="text-[#f43f5e] text-[10px] font-bold tracking-[6px]">NOW RECORDING</span>
        </div>
        <h1 className="text-[28px] sm:text-[36px] md:text-[84px] font-black italic text-white text-cinematic leading-[0.92] tracking-tight">
          <SplitText text="IT ALL" delay={0.2} />
          <br />
          <SplitText text="STARTS HERE." delay={0.45} />
        </h1>
        <div className="flex items-center gap-4 mt-7">
          <div className="w-16 h-[1px] bg-amber/60" />
          <span className="text-white/50 text-[9px] sm:text-[10px] tracking-[4px] font-bold">DM VIBES · EST. 2020 · CAIRO, EG</span>
        </div>
      </Overlay>

      <Overlay show={show(0.12, 0.23)} align="center">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-[1px] bg-amber" />
          <span className="text-amber text-[10px] font-bold tracking-[6px]">02 · ABOUT US</span>
          <div className="w-8 h-[1px] bg-amber" />
        </div>
        <h2 className="text-[22px] sm:text-[30px] md:text-[54px] font-black text-white text-cinematic leading-[1] max-w-[820px] text-center tracking-tight">
          <SplitText text="WE DON'T JUST" delay={0.1} />
          <br />
          <SplitText text="CREATE CONTENT." delay={0.25} />
          <br />
          <span className="text-amber italic text-amber-glow"><SplitText text="WE MADE VIBES." delay={0.4} /></span>
        </h2>
        <p className="text-white/55 text-[11px] sm:text-[13px] mt-7 max-w-[440px] text-center leading-relaxed animate-[fadeUp_1s_0.7s_both]">
          A creative production and digital marketing studio focused on visual experiences, powerful content, and growth-driven strategies.
        </p>
      </Overlay>

      <Overlay show={show(0.24, 0.34)} align="left">
        <ServiceHeader num="03" label="SERVICE 01" />
        <h2 className="text-[30px] sm:text-[42px] md:text-[68px] font-black text-white text-cinematic leading-[0.92] tracking-tight">
          <SplitText text="MEDIA" delay={0.1} />
          <br />
          <span className="text-amber italic text-amber-glow"><SplitText text="PRODUCTION" delay={0.28} /></span>
        </h2>
        <div className="mt-8 space-y-2.5">
          <ServiceBullet delay={0.5}>Studio · Cameras · Lights</ServiceBullet>
          <ServiceBullet delay={0.6}>Sound · Production</ServiceBullet>
        </div>
      </Overlay>

      <Overlay show={show(0.34, 0.44)} align="left">
        <ServiceHeader num="04" label="SERVICE 02" />
        <h2 className="text-[30px] sm:text-[42px] md:text-[68px] font-black text-white text-cinematic leading-[0.92] tracking-tight">
          <SplitText text="DIGITAL" delay={0.1} />
          <br />
          <span className="text-amber italic text-amber-glow"><SplitText text="MARKETING" delay={0.28} /></span>
        </h2>
        <div className="mt-8 space-y-2.5">
          <ServiceBullet delay={0.5}>Social Media · Ads</ServiceBullet>
          <ServiceBullet delay={0.6}>Strategy · Growth</ServiceBullet>
          <ServiceBullet delay={0.7}>Analytics · ROI Tracking</ServiceBullet>
        </div>
      </Overlay>

      <Overlay show={show(0.44, 0.54)} align="right">
        <div className="flex items-center gap-3 mb-4 justify-end">
          <span className="text-amber text-[10px] font-bold tracking-[6px]">05 · SERVICE 03</span>
          <div className="w-8 h-[1px] bg-amber" />
        </div>
        <h2 className="text-[30px] sm:text-[42px] md:text-[68px] font-black text-white text-cinematic leading-[0.92] tracking-tight text-right">
          <SplitText text="A HIGHER" delay={0.1} />
          <br />
          <span className="text-amber italic text-amber-glow"><SplitText text="VIEW." delay={0.28} /></span>
        </h2>
        <p className="text-white/55 text-[11px] sm:text-[13px] mt-6 max-w-[340px] text-right leading-relaxed ml-auto">
          See your brand from a different perspective. Cinematic aerial storytelling with cinema-grade drones.
        </p>
      </Overlay>

      <Overlay show={show(0.54, 0.64)} align="left">
        <ServiceHeader num="06" label="SERVICE 04" />
        <h2 className="text-[30px] sm:text-[42px] md:text-[68px] font-black text-white text-cinematic leading-[0.92] tracking-tight">
          <SplitText text="VIDEO" delay={0.1} />
          <br />
          <span className="text-amber italic text-amber-glow"><SplitText text="EDITING" delay={0.28} /></span>
        </h2>
        <p className="text-white/55 text-[11px] sm:text-[13px] mt-6 max-w-[340px] leading-relaxed">
          Every frame tells a story. Post-production crafted with precision and cinema-grade color.
        </p>
      </Overlay>

      {/* 🆕 DM CLIENTS — ALL 27 LOGOS, IN-PAGE, ANIMATED */}
      <Overlay show={show(0.64, 0.72)} align="center">
        <div className="w-full max-w-[1100px]">
          <div className="mb-3 md:mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-6 md:w-8 h-[1px] bg-white/30" />
              <span className="text-white/70 text-[9px] md:text-[10px] font-bold tracking-[4px] md:tracking-[6px]">07 · DM CLIENTS</span>
            </div>
            <span className="text-amber text-[9px] md:text-[10px] font-bold tracking-[3px] md:tracking-[4px]">TRUSTED BY 27+ BRANDS</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 md:grid-cols-5 lg:grid-cols-6 md:gap-3">
            {DM_CLIENTS.map((client, i) => (
              <AnimatedClientCard
                key={client.name}
                client={client}
                index={i}
                total={DM_CLIENTS.length}
              />
            ))}
          </div>
        </div>
      </Overlay>

      <Overlay show={show(0.72, 0.80)} align="center">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-[1px] bg-amber" />
          <span className="text-amber text-[10px] font-bold tracking-[6px]">08 · OUR WORK</span>
          <div className="w-8 h-[1px] bg-amber" />
        </div>
        <h2 className="text-[26px] sm:text-[36px] md:text-[80px] font-black text-white text-cinematic leading-[0.92] tracking-tight">
          <SplitText text="SELECTED" delay={0.1} />
          <br />
          <span className="text-amber italic text-amber-glow"><SplitText text="PROJECTS." delay={0.28} /></span>
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-8">
          {["MEDIA", "BRANDING", "SOCIAL", "CAMPAIGNS", "VIDEO"].map((cat, i) => (
            <span key={cat} className="text-white/40 text-[10px] font-bold tracking-[3px]" style={{ animation: `fadeUp 0.6s ${0.5 + i * 0.08}s both` }}>
              {cat}
            </span>
          ))}
        </div>
      </Overlay>

      <Overlay show={show(0.80, 0.88)} align="center">
        <div className="flex items-center gap-3 mb-6 md:mb-10">
          <div className="w-8 h-[1px] bg-amber" />
          <span className="text-amber text-[9px] md:text-[10px] font-bold tracking-[4px] md:tracking-[6px]">09 · THE NUMBERS</span>
          <div className="w-8 h-[1px] bg-amber" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-14">
          <div className="relative flex items-center justify-center w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] md:w-[170px] md:h-[170px]">
            <StatRing color="#4f7bff" delay={0} size={140} />
            <StatBig value={120} suffix="+" label="PROJECTS" delay={0} />
          </div>
          <div className="relative flex items-center justify-center w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] md:w-[170px] md:h-[170px]">
            <StatRing color="#a78bfa" delay={1} size={140} />
            <StatBig value={35} suffix="+" label="BRANDS" delay={0.15} />
          </div>
          <div className="relative flex items-center justify-center w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] md:w-[170px] md:h-[170px]">
            <StatRing color="#d946ef" delay={2} size={140} />
            <StatBig value={4} suffix="" label="SERVICES" delay={0.3} />
          </div>
          <div className="relative flex items-center justify-center w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] md:w-[170px] md:h-[170px]">
            <StatRing color="#34d399" delay={3} size={140} />
            <StatBigStatic value="∞" label="IDEAS" delay={0.45} />
          </div>
        </div>
      </Overlay>

      <Overlay show={show(0.88, 0.96)} align="center">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[1px] bg-amber" />
          <span className="text-amber text-[10px] font-bold tracking-[6px]">10 · FOLLOW THE VIBES</span>
          <div className="w-8 h-[1px] bg-amber" />
        </div>
        <h2 className="text-[24px] sm:text-[30px] md:text-[56px] font-black text-white text-cinematic leading-[0.95] tracking-tight mb-2">
          <SplitText text="JOIN THE" delay={0.1} />
          <br />
          <span className="text-amber italic text-amber-glow"><SplitText text="MOVEMENT." delay={0.28} /></span>
        </h2>
        <p className="text-white/50 text-[10px] sm:text-[12px] tracking-[2px] max-w-[420px] text-center leading-relaxed mt-3 mb-7 animate-[fadeUp_1s_0.5s_both]">
          Follow us on social media for behind-the-scenes, drops, and cinematic work.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 w-full max-w-[820px]">
          <SocialCard platform="instagram" handle="@dmvibes.eg" followers="24.5K" tag="STORIES · REELS" url={SOCIAL_LINKS.instagram} delay={0.6} />
          <SocialCard platform="facebook" handle="/dmvibes.eg" followers="18.2K" tag="COMMUNITY · LIVE" url={SOCIAL_LINKS.facebook} delay={0.72} />
          <SocialCard platform="youtube" handle="@DMVibes" followers="42.8K" tag="4K · CINEMATIC" url={SOCIAL_LINKS.youtube} delay={0.84} />
        </div>
      </Overlay>

      <Overlay show={show(0.96, 1.01)} align="center">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[1px] bg-amber" />
          <span className="text-amber text-[10px] font-bold tracking-[6px]">11 · GOT A VISION?</span>
          <div className="w-8 h-[1px] bg-amber" />
        </div>
        <h2 className="text-[24px] sm:text-[32px] md:text-[64px] font-black text-white text-cinematic leading-[0.95] tracking-tight">
          <SplitText text="LET'S MAKE" delay={0.1} />
          <br />
          <span className="text-amber italic text-amber-glow"><SplitText text="IT REAL." delay={0.28} /></span>
        </h2>
        <div className="flex items-center gap-3 mt-6">
          <div className="w-2 h-2 rounded-full bg-amber shadow-[0_0_14px_#4f7bff] animate-[pulseDot_1.6s_ease-in-out_infinite]" />
          <span className="text-white/50 text-[11px] tracking-[6px] font-bold">GOOD VIBES ONLY</span>
        </div>
        <button
          type="button"
          onClick={onStartProject}
          data-hover
          className="pointer-events-auto group relative inline-flex items-center gap-3 mt-7 px-7 py-3.5 rounded-full text-white font-bold tracking-[3px] text-xs transition-all duration-300 hover:scale-105 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #4f7bff 0%, #8b5cf6 100%)",
            boxShadow: "0 0 30px rgba(79,123,255,0.45), inset 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
          <motion.span
            aria-hidden
            className="absolute inset-0 opacity-0 group-hover:opacity-100"
            style={{ background: "conic-gradient(from 0deg, transparent, rgba(255,255,255,0.35), transparent)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <span className="relative z-10">START A PROJECT</span>
          <span className="relative z-10 group-hover:translate-x-1 transition-transform">→</span>
        </button>
        <div className="flex flex-wrap items-center justify-center gap-5 md:gap-6 mt-9 text-[10px] tracking-[3px] text-white/40 font-bold">
          <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer" data-hover className="pointer-events-auto hover:text-amber transition-colors">INSTAGRAM</a>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noreferrer" data-hover className="pointer-events-auto hover:text-amber transition-colors">FACEBOOK</a>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noreferrer" data-hover className="pointer-events-auto hover:text-amber transition-colors">YOUTUBE</a>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <a href={SOCIAL_LINKS.x} target="_blank" rel="noreferrer" data-hover className="pointer-events-auto hover:text-amber transition-colors">X</a>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <a href="mailto:hello@dmvibes.eg" data-hover className="pointer-events-auto hover:text-amber transition-colors">EMAIL</a>
        </div>
      </Overlay>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SERVICE HEADER / BULLET
// ═══════════════════════════════════════════════════════════
function ServiceHeader({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-[1px] bg-amber origin-left" style={{ animation: "expandLine 0.8s cubic-bezier(0.16,1,0.3,1) both" }} />
      <span className="text-amber text-[10px] font-bold tracking-[6px]">{num} · {label}</span>
    </div>
  );
}

function ServiceBullet({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <div className="flex items-center gap-3" style={{ animation: `fadeUp 0.6s ${delay}s both` }}>
      <div className="w-4 h-[1px] bg-amber/40" />
      <span className="text-white/50 text-xs tracking-[2px] font-medium">{children}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════
function StatBig({ value, suffix, label, delay = 0 }: { value: number; suffix: string; label: string; delay?: number }) {
  return (
    <motion.div
      className="flex flex-col items-center cursor-default relative z-10"
      style={{ animation: `fadeUp 0.8s ${delay}s both` }}
      whileHover={{ y: -6, scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="flex items-baseline justify-center tabular-nums">
        <span
          className="text-[28px] sm:text-[40px] md:text-[72px] lg:text-[88px] font-black text-white leading-none tracking-tighter tabular-nums"
          style={{ textShadow: "0 0 44px rgba(79,123,255,0.4)", minWidth: "1ch" }}
        >
          <AnimatedCounter target={value} />
        </span>
        {suffix && (
          <span className="text-[14px] sm:text-[22px] md:text-[44px] lg:text-[52px] font-black text-amber leading-none ml-0.5 md:ml-1">
            {suffix}
          </span>
        )}
      </div>
      <span className="text-white/40 text-[8px] md:text-[10px] tracking-[3px] md:tracking-[5px] font-bold mt-2 md:mt-4">
        {label}
      </span>
    </motion.div>
  );
}

function StatBigStatic({ value, label, delay = 0 }: { value: string; label: string; delay?: number }) {
  return (
    <motion.div
      className="flex flex-col items-center cursor-default relative z-10"
      style={{ animation: `fadeUp 0.8s ${delay}s both` }}
      whileHover={{ y: -6, scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="flex items-baseline justify-center">
        <span
          className="text-[28px] sm:text-[40px] md:text-[72px] lg:text-[88px] font-black text-white leading-none tracking-tighter"
          style={{ textShadow: "0 0 44px rgba(139,92,246,0.45)", animation: "glowPulse 3s ease-in-out infinite" }}
        >
          {value}
        </span>
      </div>
      <span className="text-white/40 text-[8px] md:text-[10px] tracking-[3px] md:tracking-[5px] font-bold mt-2 md:mt-4">
        {label}
      </span>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// SOCIAL CARD
// ═══════════════════════════════════════════════════════════
const SOCIAL_ICONS = { instagram: InstagramIcon, facebook: FacebookIcon, youtube: YouTubeIcon } as const;
const SOCIAL_COLORS = {
  instagram: { accent: "#d946ef", glow: "rgba(217,70,239,0.5)" },
  facebook:  { accent: "#4f7bff", glow: "rgba(79,123,255,0.5)" },
  youtube:   { accent: "#f43f5e", glow: "rgba(244,63,94,0.5)" },
} as const;

function SocialCard({ platform, handle, followers, tag, url, delay = 0 }: {
  platform: "instagram" | "facebook" | "youtube";
  handle: string; followers: string; tag: string; url: string; delay?: number;
}) {
  const Icon = SOCIAL_ICONS[platform];
  const { accent, glow } = SOCIAL_COLORS[platform];

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      data-hover
      className="pointer-events-auto group relative flex flex-col items-start gap-2.5 p-3 sm:p-4 md:p-5 rounded-2xl border border-white/8 bg-white/[0.02] backdrop-blur-md overflow-hidden transition-all duration-500 hover:border-white/20 hover:-translate-y-1"
      style={{ animation: `fadeUp 0.8s ${delay}s both`, willChange: "transform" }}
    >
      <span aria-hidden className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl" style={{ background: glow }} />
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[2px] origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-500" style={{ background: accent }} />

      <div className="flex items-center justify-between w-full relative z-10">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 transition-all duration-500 group-hover:scale-110" style={{ color: accent, background: `linear-gradient(135deg, ${accent}22, transparent)`, boxShadow: `0 0 0 0 ${glow}` }}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-[9px] tracking-[3px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ color: accent }}>
          FOLLOW →
        </span>
      </div>

      <div className="relative z-10 mt-1">
        <div className="flex items-baseline gap-2">
          <span className="text-white text-lg sm:text-xl md:text-2xl font-black tabular-nums leading-none">{followers}</span>
          <span className="text-white/40 text-[9px] sm:text-[10px] font-bold tracking-[3px]">FOLLOWERS</span>
        </div>
        <div className="text-white/60 text-[11px] font-semibold tracking-wider mt-2.5">{handle}</div>
        <div className="text-white/30 text-[9px] tracking-[3px] font-bold mt-1 uppercase">{tag}</div>
      </div>
    </a>
  );
}

// ═══════════════════════════════════════════════════════════
// OVERLAY WRAPPER
// ═══════════════════════════════════════════════════════════
function Overlay({ show, align, children }: { show: number; align: "left" | "right" | "center" | "bottom-left"; children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const textAlignClass =
    align === "center"
      ? "items-center text-center"
      : align === "right"
      ? "items-end text-right"
      : "items-start text-left";

  const isHero = align === "bottom-left";
  const ty = show ? 0 : 24;
  const scale = show ? 1 : 0.98;

  let positionedClass = "";
  let finalTransform = "";

  if (isMobile) {
    if (isHero) {
      positionedClass = "bottom-[8vh] left-[5vw] right-[5vw]";
      finalTransform = `translateY(${ty * 0.5}px) scale(${scale})`;
    } else if (align === "center") {
      positionedClass = "top-1/2 left-0 right-0 px-[5vw]";
      finalTransform = `translateY(-50%) translateY(${ty * 0.5}px) scale(${scale})`;
    } else if (align === "right") {
      positionedClass = "top-1/2 right-[5vw] left-[10vw]";
      finalTransform = `translateY(-50%) translateY(${ty * 0.5}px) scale(${scale})`;
    } else {
      positionedClass = "top-1/2 left-[5vw] right-[10vw]";
      finalTransform = `translateY(-50%) translateY(${ty * 0.5}px) scale(${scale})`;
    }
  } else {
    if (isHero) {
      positionedClass = "bottom-[14vh] left-[6%]";
      finalTransform = `translateY(${ty}px) scale(${scale})`;
    } else if (align === "center") {
      positionedClass = "top-1/2 left-1/2";
      finalTransform = `translate(-50%, -50%) translateY(${ty}px) scale(${scale})`;
    } else if (align === "right") {
      positionedClass = "top-1/2 right-[6%]";
      finalTransform = `translateY(-50%) translateY(${ty}px) scale(${scale})`;
    } else {
      positionedClass = "top-1/2 left-[6%]";
      finalTransform = `translateY(-50%) translateY(${ty}px) scale(${scale})`;
    }
  }

  return (
    <div
      className={`absolute flex flex-col ${positionedClass} ${textAlignClass} transition-opacity transition-transform duration-700`}
      style={{
        opacity: show,
        transform: finalTransform,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        maxHeight: isMobile ? "calc(100dvh - 140px)" : "calc(100vh - 180px)",
        maxWidth: isMobile ? "100%" : "min(1180px, 92vw)",
        pointerEvents: "none",
        willChange: "transform, opacity",
        overflow: "hidden",
      }}
    >
      <div
        className="w-full flex flex-col"
        style={{
          maxHeight: isMobile ? "calc(100dvh - 160px)" : "calc(100vh - 200px)",
          overflowY: isMobile ? "auto" : "visible",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════
const NAV = [
  { label: "Home", target: 0 },
  { label: "About", target: 0.17 },
  { label: "Services", target: 0.4 },
  { label: "Work", target: 0.68 },
  { label: "Social", target: 0.85 },
  { label: "Contact", target: 0.95 },
];

function Navigation({ ready, onOpenForm }: { ready: boolean; onOpenForm: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = useCallback((p: number) => {
    const max = document.body.scrollHeight - window.innerHeight;
    window.scrollTo({ top: p * max, behavior: "smooth" });
    setOpen(false);
  }, []);

  if (!ready) return null;

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-[250] transition-all duration-500"
        style={{
          backgroundColor: scrolled ? "rgba(4,5,12,0.72)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(79,123,255,0.08)" : "1px solid transparent",
        }}
      >
        <div className="px-6 md:px-10 py-4 flex items-center justify-between">
          <button onClick={() => goTo(0)} data-hover className="flex items-center gap-3 group">
            <div className="relative">
              <span className="block w-2 h-2 bg-amber shadow-[0_0_12px_#4f7bff] group-hover:scale-150 transition-transform" />
              <span className="absolute inset-0 w-2 h-2 bg-amber/40 animate-ping" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-white text-sm md:text-base font-black tracking-[5px] leading-none">DM VIBES</span>
              <span className="text-white/30 text-[8px] tracking-[3px] font-bold mt-0.5">CREATIVE STUDIO</span>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <button
                key={n.label}
                onClick={() => goTo(n.target)}
                data-hover
                className="relative px-4 py-2 text-[11px] tracking-[3px] font-semibold text-white/60 hover:text-amber transition-colors group"
              >
                <ScrambleText text={n.label.toUpperCase()} />
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-amber group-hover:w-6 transition-all duration-300" />
              </button>
            ))}
            <MagneticButton
              onClick={onOpenForm}
              data-hover
              strength={0.25}
              className="ml-4 px-5 py-2 rounded-full text-white text-[10px] font-bold tracking-[3px] transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #4f7bff 0%, #8b5cf6 100%)",
                boxShadow: "0 0 20px rgba(79,123,255,0.35)",
              }}
            >
              LET&apos;S TALK
            </MagneticButton>
          </nav>

          <button onClick={() => setOpen(!open)} className="md:hidden relative w-8 h-6 flex flex-col justify-between" aria-label="Menu">
            <span className="block h-[1.5px] bg-white transition-all duration-300" style={{ transform: open ? "translateY(10px) rotate(45deg)" : "none" }} />
            <span className="block h-[1.5px] bg-white transition-opacity duration-300" style={{ opacity: open ? 0 : 1 }} />
            <span className="block h-[1.5px] bg-white transition-all duration-300" style={{ transform: open ? "translateY(-10px) rotate(-45deg)" : "none" }} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[240] bg-ink/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col items-center justify-center h-full gap-8">
              {NAV.map((n, i) => (
                <motion.button
                  key={n.label}
                  onClick={() => goTo(n.target)}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="text-white text-2xl font-black tracking-[4px] hover:text-amber transition-colors"
                >
                  {n.label.toUpperCase()}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// LOADING SCREEN — with FULL VIDEO INTRO
// ═══════════════════════════════════════════════════════════
function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [stage, setStage] = useState("INITIALIZING");
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const minTimeElapsed = useRef(false);
  const progressDone = useRef(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      minTimeElapsed.current = true;
    }, 4500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const stages = ["INITIALIZING", "LOADING ASSETS", "COMPILING SCENES", "READY TO ROLL"];
    let p = 0;
    const int = setInterval(() => {
      p += Math.random() * 10 + 3;
      if (p >= 100) {
        p = 100;
        clearInterval(int);
        setStage("READY TO ROLL");
        progressDone.current = true;
      } else {
        setStage(stages[Math.min(Math.floor(p / 25), stages.length - 1)]);
      }
      setProgress(p);
    }, 130);
    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    const check = setInterval(() => {
      if (progressDone.current && minTimeElapsed.current && !hidden) {
        setHidden(true);
        setTimeout(onComplete, 700);
        clearInterval(check);
      }
    }, 200);
    return () => clearInterval(check);
  }, [hidden, onComplete]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlaying = () => setVideoReady(true);
    v.addEventListener("playing", onPlaying);
    v.play().catch(() => {
      /* autoplay blocked — video stays hidden, loader continues */
    });
    return () => v.removeEventListener("playing", onPlaying);
  }, []);

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[500] overflow-hidden"
          style={{
            background: "#04050c",
            padding: 0,
            margin: 0,
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(79,123,255,0.15) 0%, transparent 70%), radial-gradient(ellipse 80% 40% at 50% 100%, rgba(139,92,246,0.12) 0%, transparent 70%)",
            }}
          />

          <video
            ref={videoRef}
            src="https://raw.githubusercontent.com/AdhamAjlan/DM-Vibes/main/public/videos/intro.webm"
            poster="/images/studio-bg.webp"
            playsInline
            muted
            autoPlay
            loop
            preload="metadata"
            className="pointer-events-none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              opacity: videoReady ? 1 : 0,
              transition: "opacity 0.7s ease",
            }}
          />

          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 55%, rgba(4,5,12,0.55) 100%)",
            }}
          />

          <div className="absolute top-6 left-5 sm:top-8 sm:left-8 flex items-center gap-2 z-10">
            <div className="w-2 h-2 rounded-full bg-[#f43f5e] shadow-[0_0_12px_#f43f5e] animate-[pulseDot_1.4s_ease-in-out_infinite]" />
            <span className="text-[#f43f5e] text-[9px] sm:text-[10px] font-bold tracking-[4px]">REC</span>
          </div>

          <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3 sm:gap-5 px-4 w-full max-w-[90vw]">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-amber shadow-[0_0_18px_#4f7bff] animate-[pulseDot_1.4s_ease-in-out_infinite]" />
              <h1 className="text-white text-lg sm:text-xl md:text-3xl font-black tracking-[6px] sm:tracking-[10px]">DM VIBES</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-[1px] bg-amber/50" />
              <motion.p
                key={stage}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-amber/90 text-[10px] tracking-[6px] font-bold"
              >
                {stage}
              </motion.p>
              <div className="w-8 h-[1px] bg-amber/50" />
            </div>

            <div className="w-[180px] sm:w-[220px] md:w-[280px] h-[3px] bg-white/10 relative overflow-hidden rounded-full">
              <div
                className="absolute inset-y-0 left-0 transition-all duration-200"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #4f7bff 0%, #8b5cf6 60%, #a78bfa 100%)",
                  boxShadow: "0 0 18px #4f7bff",
                }}
              />
            </div>

            <div className="flex items-center gap-6 text-[10px] tracking-[3px] font-mono">
              <span className="text-white/50">{String(Math.floor(progress)).padStart(3, "0")}%</span>
              <span className="text-white/20">·</span>
              <span className="text-white/50">4K · 24FPS</span>
            </div>
          </div>

          <div className="absolute bottom-8 left-8 text-[9px] tracking-[3px] text-white/40 font-bold z-10 hidden sm:block">
            DMV · CREATIVE STUDIO
          </div>
          <div className="absolute bottom-8 right-8 text-[9px] tracking-[3px] text-white/40 font-bold z-10 hidden sm:block">
            CAIRO · EGYPT
          </div>

          <div className="absolute top-16 left-6 w-8 h-8 border-l border-t border-amber/40 z-10" />
          <div className="absolute top-16 right-6 w-8 h-8 border-r border-t border-amber/40 z-10" />
          <div className="absolute bottom-16 left-6 w-8 h-8 border-l border-b border-amber/40 z-10" />
          <div className="absolute bottom-16 right-6 w-8 h-8 border-r border-b border-amber/40 z-10" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════
// CUSTOM CURSOR
// ═══════════════════════════════════════════════════════════
function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 768px)").matches) return;

    let mx = 0, my = 0, rx = 0, ry = 0, hovering = false;
    let raf: number;
    const trailPositions: { x: number; y: number }[] = Array.from({ length: 5 }, () => ({ x: 0, y: 0 }));

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      const target = e.target as HTMLElement;
      const hoverEl = target.closest("[data-cursor]") as HTMLElement | null;
      const isHover = target.closest("button, a, [data-hover]") !== null;
      if (isHover !== hovering) {
        hovering = isHover;
        if (ringRef.current) {
          ringRef.current.style.width = hovering ? "56px" : "32px";
          ringRef.current.style.height = hovering ? "56px" : "32px";
          ringRef.current.style.borderColor = hovering ? "#4f7bff" : "rgba(255,255,255,0.5)";
          ringRef.current.style.background = hovering ? "rgba(79,123,255,0.1)" : "transparent";
        }
      }
      if (labelRef.current) {
        if (hoverEl && hoverEl.dataset.cursor) {
          labelRef.current.textContent = hoverEl.dataset.cursor;
          labelRef.current.style.opacity = "1";
        } else {
          labelRef.current.style.opacity = "0";
        }
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mx - 3}px, ${my - 3}px, 0)`;
      }
    };

    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (ringRef.current) {
        const size = hovering ? 56 : 32;
        ringRef.current.style.transform = `translate3d(${rx - size / 2}px, ${ry - size / 2}px, 0)`;
      }
      if (labelRef.current) {
        labelRef.current.style.transform = `translate3d(${rx + 40}px, ${ry - 10}px, 0)`;
      }

      let prevX = rx;
      let prevY = ry;
      trailPositions.forEach((tp, i) => {
        tp.x += (prevX - tp.x) * (0.35 - i * 0.04);
        tp.y += (prevY - tp.y) * (0.35 - i * 0.04);
        prevX = tp.x;
        prevY = tp.y;
        const el = trailRefs.current[i];
        if (el) {
          const size = 6 - i * 0.8;
          el.style.transform = `translate3d(${tp.x - size / 2}px, ${tp.y - size / 2}px, 0)`;
          el.style.width = `${size}px`;
          el.style.height = `${size}px`;
          el.style.opacity = `${0.28 - i * 0.045}`;
        }
      });

      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          ref={(el) => { if (el) trailRefs.current[i] = el; }}
          className="fixed top-0 left-0 pointer-events-none z-[299] rounded-full hidden md:block"
          style={{ background: "linear-gradient(135deg, #4f7bff, #8b5cf6)", willChange: "transform, width, height, opacity" }}
        />
      ))}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none z-[300] rounded-full border hidden md:block"
        style={{ width: 32, height: 32, borderColor: "rgba(255,255,255,0.5)", transition: "width 0.25s, height 0.25s, border-color 0.25s, background 0.25s", willChange: "transform" }}
      />
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-[300] w-1.5 h-1.5 rounded-full hidden md:block"
        style={{ background: "linear-gradient(135deg, #4f7bff, #8b5cf6)", willChange: "transform" }}
      />
      <div
        ref={labelRef}
        className="fixed top-0 left-0 pointer-events-none z-[301] text-[10px] font-bold tracking-[3px] text-amber opacity-0 transition-opacity duration-200 hidden md:block whitespace-nowrap"
        style={{ willChange: "transform, opacity" }}
      />
    </>
  );
}

function ProjectApplicationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[400] flex items-center justify-center bg-[#050507]/80 backdrop-blur-md px-3 sm:px-4 py-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-2xl sm:rounded-[28px] border border-white/10 bg-[#0a0d17]/90 p-4 sm:p-5 shadow-[0_0_40px_rgba(79,123,255,0.24)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 sm:right-4 top-3 sm:top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white/70 transition hover:border-white/20 hover:text-white"
              aria-label="Close form"
            >
              ×
            </button>

            {submitted ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-3xl text-emerald-400">
                  ✓
                </div>
                <h3 className="text-2xl font-black tracking-[2px] text-white">Application received</h3>
                <p className="mt-3 text-sm text-white/60">
                  Thanks for reaching out. We&apos;ll review your project and get back to you soon.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-8 rounded-full bg-gradient-to-r from-[#4f7bff] to-[#8b5cf6] px-6 py-3 text-xs font-bold tracking-[3px] text-white"
                >
                  CLOSE
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6 pr-10">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="h-px w-10 bg-[#ffc857]" />
                    <span className="text-[10px] font-bold tracking-[5px] text-[#ffc857]">PROJECT APPLICATION</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">Start your next project</h3>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-xs font-semibold tracking-[2px] text-white/60 md:col-span-1">
                    Full name
                    <input
                      required
                      type="text"
                      placeholder="Your name"
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base sm:text-sm text-white placeholder:text-white/35 focus:border-[#4f7bff] focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-xs font-semibold tracking-[2px] text-white/60 md:col-span-1">
                    Email address
                    <input
                      required
                      type="email"
                      placeholder="you@example.com"
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base sm:text-sm text-white placeholder:text-white/35 focus:border-[#4f7bff] focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-xs font-semibold tracking-[2px] text-white/60 md:col-span-1">
                    Company / brand
                    <input
                      type="text"
                      placeholder="Brand name"
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base sm:text-sm text-white placeholder:text-white/35 focus:border-[#4f7bff] focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-xs font-semibold tracking-[2px] text-white/60 md:col-span-1">
                    Service needed
                    <select
                      defaultValue={PROJECT_SERVICES[0]}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base sm:text-sm text-white focus:border-[#4f7bff] focus:outline-none"
                    >
                      {PROJECT_SERVICES.map((service) => (
                        <option key={service} value={service} className="text-slate-900">
                          {service}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-2 text-xs font-semibold tracking-[2px] text-white/60 md:col-span-1">
                    Budget range
                    <input
                      type="text"
                      placeholder="$1,000 – $5,000"
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base sm:text-sm text-white placeholder:text-white/35 focus:border-[#4f7bff] focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-xs font-semibold tracking-[2px] text-white/60 md:col-span-1">
                    Project timeline
                    <input
                      type="text"
                      placeholder="Example: 3 weeks"
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base sm:text-sm text-white placeholder:text-white/35 focus:border-[#4f7bff] focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-xs font-semibold tracking-[2px] text-white/60 md:col-span-2">
                    Project brief
                    <textarea
                      required
                      rows={5}
                      placeholder="Tell us about your vision, goals, and key deliverables..."
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base sm:text-sm text-white placeholder:text-white/35 focus:border-[#4f7bff] focus:outline-none"
                    />
                  </label>

                  <div className="md:col-span-2 flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[10px] tracking-[2px] text-white/40">
                      We usually reply within 24 hours.
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-bold tracking-[3px] text-white/75 transition hover:border-white/20 hover:text-white"
                      >
                        CANCEL
                      </button>
                      <button
                        type="submit"
                        className="rounded-full bg-gradient-to-r from-[#4f7bff] to-[#8b5cf6] px-6 py-3 text-[10px] font-bold tracking-[3px] text-white shadow-[0_0_30px_rgba(79,123,255,0.35)]"
                      >
                        SEND APPLICATION
                      </button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Page() {
  const [ready, setReady] = useState(false);
  const [projectFormOpen, setProjectFormOpen] = useState(false);

  return (
    <main className="relative w-full">
      <CustomCursor />
      <LoadingScreen onComplete={() => setReady(true)} />
      <Navigation ready={ready} onOpenForm={() => setProjectFormOpen(true)} />
      <Experience ready={ready} onStartProject={() => setProjectFormOpen(true)} />
      <ProjectApplicationModal open={projectFormOpen} onClose={() => setProjectFormOpen(false)} />
    </main>
  );
}