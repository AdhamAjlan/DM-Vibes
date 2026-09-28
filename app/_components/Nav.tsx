"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CHAPTERS, SOCIAL_LINKS } from "../_lib/site";
import { useRoute, type Route } from "../_lib/route";
import type { Anchor } from "../_lib/scroll";
import { MagneticButton, ScrambleText } from "./ui";

type Item = { label: string; route: Route; anchor?: Anchor };

const NAV: Item[] = [
  { label: "Story", route: "home", anchor: "camera" },
  { label: "Services", route: "home", anchor: "services" },
  { label: "Clients", route: "clients" },
  { label: "Contact", route: "home", anchor: "contact" },
];

const MENU: Item[] = [
  ...CHAPTERS.slice(5, 10).map((c) => ({ label: c.label.join(" "), route: "home" as const, anchor: c.id })),
  { label: "Services", route: "home", anchor: "services" },
  { label: "Numbers", route: "home", anchor: "numbers" },
  { label: "Clients", route: "clients" },
  { label: "Contact", route: "home", anchor: "contact" },
];

export function Navigation({ ready, onOpenForm }: { ready: boolean; onOpenForm: () => void }) {
  const { route, navigate } = useRoute();
  const [menuOpen, setMenuOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  // The bar stays transparent over the film and gains a backdrop on the page sections.
  useEffect(() => {
    const onScroll = () => {
      const track = document.getElementById("story-track");
      const end = track ? track.getBoundingClientRect().top + window.scrollY + track.offsetHeight - window.innerHeight : 40;
      setSolid(window.scrollY > end - 10);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [route]);

  if (!ready) return null;

  const go = (item: Item) => {
    setMenuOpen(false);
    navigate(item.route, item.anchor);
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[250] transition-[background-color,backdrop-filter,border-color] duration-500 ${
          solid || route === "clients" ? "border-b border-white/[0.06] bg-[#05060d]/70 backdrop-blur-xl" : "border-b border-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 md:px-10">
          <button onClick={() => navigate("home", "top")} data-hover className="group flex items-center gap-3" aria-label="DM Vibes — back to start">
            <span className="block h-2 w-2 bg-[var(--accent)] shadow-[0_0_12px_var(--accent)] transition-transform group-hover:scale-150" />
            <span className="text-[13px] font-semibold uppercase tracking-[0.32em] text-white">DM Vibes</span>
          </button>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV.map((n) => {
              const active = n.route === "clients" && route === "clients";
              return (
                <button
                  key={n.label}
                  onClick={() => go(n)}
                  data-hover
                  className={`relative px-4 py-2 text-[11px] font-medium uppercase tracking-[0.24em] transition-colors ${
                    active ? "text-white" : "text-white/55 hover:text-white"
                  }`}
                >
                  <ScrambleText text={n.label} />
                </button>
              );
            })}
            <MagneticButton onClick={onOpenForm} data-hover className="btn-primary ml-4 !px-5 !py-2.5 !text-[10px]">
              Let&apos;s talk
            </MagneticButton>
          </nav>

          <button
            onClick={() => setMenuOpen(true)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-white/80 backdrop-blur-md transition hover:border-white/30 hover:text-white lg:hidden"
            aria-label="Open menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 7h18M3 17h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Menu</span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[400] flex flex-col bg-[#05060d]/95 backdrop-blur-xl"
          >
            <div className="flex justify-end p-5">
              <button
                onClick={() => setMenuOpen(false)}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-white/30 hover:text-white"
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-1 overflow-y-auto px-8 md:px-20">
              {MENU.map((item, i) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => go(item)}
                  className="group flex items-baseline gap-4 py-1.5 text-left"
                >
                  <span className="w-8 text-[11px] tabular-nums text-[var(--muted)]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[clamp(1.8rem,6vw,3.6rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white/70 transition-colors group-hover:text-white">
                    {item.label}
                  </span>
                </motion.button>
              ))}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenForm();
                }}
                className="btn-primary mt-8 self-start"
              >
                Start a project →
              </button>
            </div>
            <div className="flex items-center justify-between gap-4 p-6 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40">
              <span>Creative Studio · Cairo</span>
              <div className="flex gap-5">
                {(
                  [
                    ["IG", SOCIAL_LINKS.instagram],
                    ["FB", SOCIAL_LINKS.facebook],
                    ["LI", SOCIAL_LINKS.linkedin],
                    ["X", SOCIAL_LINKS.x],
                  ] as const
                ).map(([l, href]) => (
                  <a key={l} href={href} target="_blank" rel="noreferrer" className="transition-colors hover:text-white">
                    {l}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
