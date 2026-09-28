"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CONTACT_INFO, PROJECT_SERVICES, sendBrief } from "../_lib/site";
import { getLenis } from "../_lib/scroll";

const field =
  "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[var(--accent)] focus:outline-none";
const label = "flex flex-col gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55";

export function ProjectApplicationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);

  // Freeze the film behind the dialog.
  useEffect(() => {
    const lenis = getLenis();
    if (open) lenis?.stop();
    else lenis?.start();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence onExitComplete={() => setSubmitted(false)}>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[400] flex items-center justify-center overflow-y-auto bg-[#030409]/80 px-4 py-8 backdrop-blur-md"
          onClick={onClose}
          data-lenis-prevent
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative my-auto w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#0a0c16]/95 p-6 shadow-[0_0_60px_rgba(91,124,255,0.18)] md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white/70 transition hover:border-white/25 hover:text-white"
              aria-label="Close form"
            >
              ×
            </button>

            {submitted ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-3xl text-emerald-400">✓</div>
                <h3 className="text-2xl font-semibold tracking-tight text-white">Almost there</h3>
                <p className="mt-3 text-sm text-white/60">Your email app should have opened with the brief filled in — just hit send and we&apos;ll get back to you within 24 hours.</p>
                <button type="button" onClick={onClose} className="btn-primary mt-8">
                  Close
                </button>
              </div>
            ) : (
              <>
                <p className="eyebrow mb-3">Project application</p>
                <h3 id="project-title" className="mb-7 text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
                  Start your next <em className="serif-accent">project</em>
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    const v = (k: string) => String(f.get(k) ?? "");
                    sendBrief({
                      Name: v("name"),
                      Email: v("email"),
                      Company: v("company"),
                      Service: v("service"),
                      Budget: v("budget"),
                      Timeline: v("timeline"),
                      Brief: v("brief"),
                    });
                    setSubmitted(true);
                  }}
                  className="grid gap-4 md:grid-cols-2"
                >
                  <label className={label}>
                    Full name
                    <input name="name" required type="text" placeholder="Your name" className={field} />
                  </label>
                  <label className={label}>
                    Email address
                    <input name="email" required type="email" placeholder="you@example.com" className={field} />
                  </label>
                  <label className={label}>
                    Company / brand
                    <input name="company" type="text" placeholder="Brand name" className={field} />
                  </label>
                  <label className={label}>
                    Service needed
                    <select name="service" defaultValue={PROJECT_SERVICES[0]} className={field}>
                      {PROJECT_SERVICES.map((s) => (
                        <option key={s} value={s} className="text-slate-900">
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={label}>
                    Budget range
                    <input name="budget" type="text" placeholder="$1,000 – $5,000" className={field} />
                  </label>
                  <label className={label}>
                    Project timeline
                    <input name="timeline" type="text" placeholder="Example: 3 weeks" className={field} />
                  </label>
                  <label className={`${label} md:col-span-2`}>
                    Project brief
                    <textarea name="brief" required rows={5} placeholder="Tell us about your vision, goals, and key deliverables..." className={field} />
                  </label>
                  <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between md:col-span-2">
                    <p className="text-[11px] leading-relaxed text-white/40">
                      We usually reply within 24 hours.
                      <br />
                      <a href={`mailto:${CONTACT_INFO.email}`} className="text-white/70 hover:text-white">
                        {CONTACT_INFO.email}
                      </a>
                      {" · "}
                      <a href={`tel:${CONTACT_INFO.phone}`} className="text-white/70 hover:text-white">
                        {CONTACT_INFO.phone}
                      </a>
                    </p>
                    <div className="flex gap-3">
                      <button type="button" onClick={onClose} className="btn-ghost">
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">
                        Send application
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
