"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { CONTACT_INFO, DM_CLIENTS, PROJECT_SERVICES, SOCIAL_LINKS, sendBrief } from "../_lib/site";
import { useRoute } from "../_lib/route";
import { FacebookIcon, InstagramIcon, LinkedInIcon, XIcon, type IconProps } from "./ui";

// ═══════════════════════════════════════════════════════════
// STORY CONTENT — the page's information, riding over the final
// lounge frame of the film (the 3D stays visible on the left).
// ═══════════════════════════════════════════════════════════

const SERVICES = [
  { title: "Media Production", body: "Concept, crew, studio and location. Cinema cameras, lighting and sound for commercials, brand films and content series." },
  { title: "Digital Marketing", body: "Social media management, paid campaigns and growth strategy — measured with analytics and ROI tracking." },
  { title: "Video Editing", body: "Offline and online edit, colour grading, sound design and motion graphics, delivered in every format you need." },
  { title: "Drone Cinematography", body: "Aerial storytelling with cinema-grade drones for property, events, tourism and brand campaigns." },
  { title: "Web Development", body: "Fast, considered websites and landing pages built to convert the attention your content earns." },
  { title: "SEO & Market Research", body: "Search engine optimization and market research that tell you where your audience is — and how to reach it." },
];

const SOCIALS: { label: string; handle: string; url: string; Icon: (p: IconProps) => React.ReactElement }[] = [
  { label: "Instagram", handle: "@dmvibes.eg", url: SOCIAL_LINKS.instagram, Icon: InstagramIcon },
  { label: "Facebook", handle: "/dmvibes.eg", url: SOCIAL_LINKS.facebook, Icon: FacebookIcon },
  { label: "LinkedIn", handle: "/company/dmvibes", url: SOCIAL_LINKS.linkedin, Icon: LinkedInIcon },
  { label: "X", handle: "@dmvibes_eg", url: SOCIAL_LINKS.x, Icon: XIcon },
];

const FEATURED = ["ORASCOM", "BUPA", "UNICEF", "KONE", "SAINT GOBAIN"];

const field =
  "w-full rounded-md border border-white/10 bg-[#0b0b14]/80 px-4 py-3 text-[13px] text-white placeholder:text-white/35 focus:border-[var(--accent)] focus:outline-none";

export function StoryContent({ onStartProject }: { onStartProject: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const { navigate } = useRoute();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          y: 40,
          autoAlpha: 0,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none reverse" },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const half = Math.ceil(DM_CLIENTS.length / 2);
  const rows = [DM_CLIENTS.slice(0, half), DM_CLIENTS.slice(half)];

  return (
    <div ref={root} className="landscape:bg-[linear-gradient(90deg,transparent_22%,rgba(4,4,10,0.82)_48%,rgba(4,4,10,0.94)_100%)] portrait:bg-[linear-gradient(180deg,transparent_0,rgba(4,4,10,0.9)_22vh)]">
      <div className="ml-auto w-full px-5 landscape:w-[min(52rem,58vw)] landscape:pr-[5vw]">
        {/* SERVICES */}
        <section id="services" className="pb-24 pt-[70vh]">
          <p data-reveal className="eyebrow mb-5">
            Services
          </p>
          <h2 data-reveal className="section-title">
            Everything a story needs
          </h2>
          <span data-reveal className="mt-6 block h-[3px] w-12 bg-[var(--accent)]" />
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
            {SERVICES.map((s, i) => (
              <article key={s.title} data-reveal className="bg-[#07070e]/90 p-7">
                <span className="text-[11px] tabular-nums text-white/40">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-5 text-lg font-light uppercase tracking-[0.06em] text-white">{s.title}</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-white/55">{s.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* NUMBERS */}
        <section id="numbers" className="border-t border-white/10 py-20">
          <dl className="grid grid-cols-2 gap-y-10 sm:grid-cols-4">
            {[
              ["120+", "Projects"],
              ["35+", "Brands"],
              [String(DM_CLIENTS.length), "Featured clients"],
              ["∞", "Ideas"],
            ].map(([v, l]) => (
              <div key={l} data-reveal>
                <dd className="text-[clamp(2.6rem,5vw,4.4rem)] font-extralight leading-none tracking-[-0.03em] text-white">{v}</dd>
                <dt className="mt-3 text-[10px] font-medium uppercase tracking-[0.26em] text-white/45">{l}</dt>
              </div>
            ))}
          </dl>
        </section>

        {/* CLIENTS */}
        <section id="clients" className="border-t border-white/10 py-20">
          <button type="button" onClick={() => navigate("clients")} data-hover data-reveal className="group flex w-full items-start justify-between text-left">
            <span>
              <span className="block text-[13px] font-medium uppercase tracking-[0.18em] text-white">DM Clients</span>
              <span className="mt-2 block text-[12px] text-white/50">See the brands we&apos;ve worked with.</span>
            </span>
            <span className="text-2xl text-white/70 transition-transform duration-500 group-hover:translate-x-2 group-hover:text-white">→</span>
          </button>
          <div data-reveal className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-5">
            {FEATURED.map((name) => {
              const c = DM_CLIENTS.find((x) => x.name === name)!;
              return (
                <img key={name} src={c.logo} alt={`${c.name} logo`} loading="lazy" className="h-7 w-auto max-w-[110px] object-contain opacity-75 [filter:brightness(0)_invert(1)]" />
              );
            })}
          </div>
          <div className="mt-12 space-y-3" aria-label="Client logos">
            {rows.map((row, r) => (
              <div key={r} className="marquee-mask flex overflow-hidden">
                <div className={`flex shrink-0 gap-3 pr-3 ${r ? "animate-marquee-rev" : "animate-marquee"}`}>
                  {[...row, ...row].map((c, i) => (
                    <div key={`${c.name}${i}`} className="flex h-16 w-36 shrink-0 items-center justify-center rounded-xl bg-[#e8ecf7] px-4">
                      <img src={c.logo} alt={i < row.length ? `${c.name} logo` : ""} loading="lazy" decoding="async" className="max-h-10 w-full object-contain mix-blend-multiply" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CONTACT — "Let's work together" */}
        <section id="contact" className="border-t border-white/10 pb-16 pt-20">
          <div className="grid gap-12 xl:grid-cols-[1fr_auto]">
            <div>
              <h2 data-reveal className="section-title">
                Let&apos;s work
                <br />
                together
              </h2>
              <p data-reveal className="mt-5 text-[13px] text-white/55">
                Have a project in mind? Let&apos;s create something amazing.
              </p>
              <ContactForm />
              <p data-reveal className="mt-5 text-[11px] text-white/40">
                Prefer a full brief?{" "}
                <button type="button" onClick={onStartProject} className="text-white/70 underline-offset-4 hover:text-white hover:underline" data-hover>
                  Open the project application
                </button>
              </p>
            </div>
            <ul data-reveal className="flex gap-3 xl:flex-col" aria-label="Social links">
              {SOCIALS.map(({ label, handle, url, Icon }) => (
                <li key={label}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    data-hover
                    aria-label={`${label} ${handle}`}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/40 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div data-reveal className="mt-16 grid gap-8 border-t border-white/10 pt-10 sm:grid-cols-3">
            <div>
              <p className="eyebrow mb-2">Office &amp; studio</p>
              <a href={`https://maps.google.com/?q=${encodeURIComponent(CONTACT_INFO.office)}`} target="_blank" rel="noreferrer" className="text-[14px] text-white/80 hover:text-white">
                {CONTACT_INFO.office}
              </a>
            </div>
            <div>
              <p className="eyebrow mb-2">Email</p>
              <a href={`mailto:${CONTACT_INFO.email}`} className="text-[14px] text-white/80 hover:text-white">
                {CONTACT_INFO.email}
              </a>
            </div>
            <div>
              <p className="eyebrow mb-2">Call</p>
              <a href={`tel:${CONTACT_INFO.phone}`} className="text-[14px] tabular-nums text-white/80 hover:text-white">
                {CONTACT_INFO.phone}
              </a>
            </div>
          </div>

          <footer className="mt-16 flex flex-col justify-between gap-3 text-[10px] font-medium uppercase tracking-[0.28em] text-white/35 sm:flex-row">
            <span>© {new Date().getFullYear()} DM Vibes · Creative Studio</span>
            <span>Cairo · Egypt</span>
          </footer>
        </section>
      </div>
    </div>
  );
}

function ContactForm() {
  const [sent, setSent] = useState(false);
  return (
    <form
      data-reveal
      className="mt-8 grid max-w-md gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        sendBrief({
          Name: String(f.get("name") ?? ""),
          Email: String(f.get("email") ?? ""),
          "Project type": String(f.get("type") ?? ""),
          Message: String(f.get("message") ?? ""),
        });
        setSent(true);
      }}
    >
      <label className="sr-only" htmlFor="c-name">
        Name
      </label>
      <input id="c-name" name="name" required placeholder="Name" className={field} />
      <label className="sr-only" htmlFor="c-email">
        Email
      </label>
      <input id="c-email" name="email" type="email" required placeholder="Email" className={field} />
      <label className="sr-only" htmlFor="c-type">
        Project type
      </label>
      <select id="c-type" name="type" defaultValue="" className={field}>
        <option value="" disabled>
          Project Type
        </option>
        {PROJECT_SERVICES.map((s) => (
          <option key={s} value={s} className="text-slate-900">
            {s}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="c-msg">
        Message
      </label>
      <textarea id="c-msg" name="message" rows={4} placeholder="Message" className={field} />
      <button type="submit" className="mt-2 rounded-md bg-[var(--accent)] px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition hover:brightness-110" data-hover>
        Let&apos;s vibe →
      </button>
      {sent && <p className="text-[12px] text-white/55">Your email app should open with the brief — just hit send.</p>}
    </form>
  );
}
