"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { DM_CLIENTS } from "../_lib/site";
import { useRoute } from "../_lib/route";

function ClientCard({ client, index }: { client: (typeof DM_CLIENTS)[number]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.05 + (index / DM_CLIENTS.length) * 0.45, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6 }}
      className="group relative flex h-24 items-center justify-center rounded-2xl bg-[#e8ecf7] px-4 transition-shadow duration-500 hover:shadow-[0_20px_40px_rgba(91,124,255,0.35)] md:h-28"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ boxShadow: `inset 0 0 0 2px ${client.accent}` }}
      />
      <img src={client.logo} alt={`${client.name} logo`} decoding="async" className="max-h-16 w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
      <span className="pointer-events-none absolute inset-x-0 -bottom-6 text-center text-[9px] font-semibold uppercase tracking-[0.2em] text-white/0 transition-colors group-hover:text-white/60">
        {client.category}
      </span>
    </motion.div>
  );
}

export function ClientsPage() {
  const { navigate } = useRoute();
  const industries = useMemo(() => new Set(DM_CLIENTS.map((c) => c.category)).size, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[var(--bg)]">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(91,124,255,0.12),transparent_55%),radial-gradient(100%_90%_at_50%_100%,rgba(109,40,217,0.14),transparent_60%)]" />

      <section className="relative z-10 px-5 pb-16 pt-36 md:px-[7vw]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <p className="eyebrow mb-6">Our clients</p>
          <h1 className="text-[clamp(3rem,9vw,8rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-white">
            Trusted by
            <br />
            <em className="serif-accent">the best.</em>
          </h1>
          <p className="mt-8 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">
            From industry giants to emerging innovators — {DM_CLIENTS.length}+ brands across construction, technology, healthcare, development and beyond.
          </p>
          <dl className="mt-12 flex flex-wrap gap-12">
            {[
              [String(DM_CLIENTS.length), "Brands"],
              [`${industries}+`, "Industries"],
              ["100%", "Satisfaction"],
            ].map(([v, l]) => (
              <div key={l}>
                <dd className="text-5xl font-semibold tracking-[-0.04em] text-white">{v}</dd>
                <dt className="mt-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">{l}</dt>
              </div>
            ))}
          </dl>
        </motion.div>
      </section>

      <section className="relative z-10 px-5 pb-28 md:px-[7vw]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {DM_CLIENTS.map((c, i) => (
            <ClientCard key={c.name} client={c} index={i} />
          ))}
        </div>
      </section>

      <section className="relative z-10 px-5 pb-32 text-center md:px-[7vw]">
        <h2 className="text-[clamp(2.2rem,5vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-white">
          Ready to join <em className="serif-accent">the family?</em>
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-[15px] text-[var(--muted)]">Let&apos;s create something remarkable together.</p>
        <button onClick={() => navigate("home", "contact")} data-hover className="btn-primary mt-9">
          Start a project →
        </button>
      </section>

      <footer className="relative z-10 flex flex-col justify-between gap-3 border-t border-white/10 px-5 py-8 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35 md:flex-row md:px-[7vw]">
        <span>© {new Date().getFullYear()} DM Vibes · Creative Studio</span>
        <span>Cairo · Egypt</span>
      </footer>
    </div>
  );
}
