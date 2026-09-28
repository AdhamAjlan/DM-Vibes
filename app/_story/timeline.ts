import { gsap } from "gsap";
import { CAM_KEYS, CREATIVE, DESK, LOUNGE, MEDIA, PAD, PHONE } from "./path";
import { rgb, type StoryState } from "./state";

// ═══════════════════════════════════════════════════════════
// MASTER TIMELINE
// The film is laid out on a 0 → 100 axis (= % of the story scroll).
// It is created paused and handed to ScrollTrigger with `scrub`, so its
// playhead IS the scroll position: nothing here "plays" on its own.
// Every channel — camera, framing, the roaming key light, each set's
// practicals, screen content, copy — is keyed on the same axis, which
// keeps them in sync in both directions.
//
//   01  0–10  logo reveal          06 38–48  media production
//   02 10–17  camera appears       07 48–58  drone
//   03 17–24  move closer          08 58–68  video editing
//   04 24–31  lens close-up        09 68–78  social & mobile
//   05 31–38  pass through         10 78–88  studio lighting
//                                  11 88–100 the lounge (content scrolls over it)
// ═══════════════════════════════════════════════════════════

type Opts = { mobile: boolean };

export function buildStoryTimeline(s: StoryState, root: HTMLElement, { mobile }: Opts) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.inOut", duration: 4 } });
  const $ = (sel: string) => root.querySelector<HTMLElement>(sel);

  // ─── CAMERA ─────────────────────────────────────────────
  for (let i = 0; i < CAM_KEYS.length - 1; i++) {
    const a = CAM_KEYS[i];
    const b = CAM_KEYS[i + 1];
    const ease = i === 0 ? "sine.in" : i === CAM_KEYS.length - 2 ? "sine.out" : "none";
    tl.to(s.cam, { k: i + 1, duration: b.t - a.t, ease }, a.t);
  }

  // Composition: sx pushes the subject right of the copy (desktop),
  // sy lifts it above the copy (portrait). Only one applies per device.
  const frame = (at: number, v: Partial<StoryState["cam"]>, duration = 4) => tl.to(s.cam, { ...v, duration }, at);
  frame(10, { fov: 38 }, 5);
  frame(22, { fov: 32 }, 6);
  frame(35, { fov: 40, sx: 0.16, sy: 0.12 }, 5);
  frame(47, { sx: 0.14, fov: 38 }, 4);
  frame(57, { sx: 0.17, fov: 38 }, 4);
  frame(67, { sx: 0.15, fov: 36 }, 4);
  frame(77, { sx: 0.17, fov: 38 }, 4);
  frame(88, { sx: -0.2, sy: 0.02, fov: 42 }, 6);

  // ─── ROAMING KEY & FILL — the light travels with the story ─
  type Key = Partial<StoryState["key"]>;
  const key = (at: number, dur: number, v: Key, color: string) => tl.to(s.key, { ...v, ...rgb(color), duration: dur }, at);
  const fill = (at: number, dur: number, v: Partial<StoryState["fill"]>, color: string) =>
    tl.to(s.fill, { ...v, ...rgb(color), duration: dur }, at);
  key(10, 6, { x: 2.8, y: 4.8, z: 3.2, tx: 0, ty: 1.4, tz: -1, i: 1 }, "#ffb46b");
  fill(10, 6, { x: -2.6, y: 1.8, z: 1.5, i: 1 }, "#4b6bff");
  key(24, 6, { i: 0.55 }, "#ffc48a");
  key(35, 5, { x: MEDIA[0] + 2.8, y: 4.5, z: MEDIA[2] + 2.5, tx: MEDIA[0] - 0.2, ty: 1, tz: MEDIA[2] - 0.4, i: 1.1 }, "#ffb46b");
  fill(35, 5, { x: MEDIA[0] - 3, y: 2, z: MEDIA[2] + 1, i: 1 }, "#4b6bff");
  key(45, 4, { x: PAD[0] - 0.5, y: 6.8, z: PAD[2] + 1.5, tx: PAD[0], ty: 0.8, tz: PAD[2], i: 1 }, "#b3c2ff");
  fill(45, 4, { x: PAD[0] + 2.5, y: 2.4, z: PAD[2] + 1.5 }, "#7a4dff");
  key(55, 5, { x: DESK[0] + 2.2, y: 4.2, z: DESK[2] + 2.6, tx: DESK[0], ty: 0.9, tz: DESK[2], i: 0.8 }, "#8aa2ff");
  fill(55, 5, { x: DESK[0] - 2, y: 1.6, z: DESK[2] + 1.2 }, "#3f6bff");
  key(66, 5, { x: PHONE[0] - 1.5, y: 4.5, z: PHONE[2] + 2.8, tx: PHONE[0], ty: PHONE[1], tz: PHONE[2], i: 0.8 }, "#b89bff");
  fill(66, 5, { x: PHONE[0] + 2, y: 2, z: PHONE[2] + 1 }, "#7a4dff");
  key(76, 5, { x: CREATIVE[0] + 1.5, y: 4.8, z: CREATIVE[2] + 2.5, tx: CREATIVE[0] - 0.9, ty: 0.9, tz: CREATIVE[2] - 0.7, i: 1.1 }, "#ffb46b");
  fill(76, 5, { x: CREATIVE[0] - 3, y: 1.8, z: CREATIVE[2] + 1 }, "#3f6bff");
  key(86, 6, { x: LOUNGE[0] + 2.8, y: 5, z: LOUNGE[2] + 3.5, tx: LOUNGE[0], ty: 0.7, tz: LOUNGE[2] - 0.6, i: 1 }, "#ffb46b");
  fill(86, 6, { x: LOUNGE[0] - 2.5, y: 2.2, z: LOUNGE[2] + 1 }, "#7a4dff");

  // ─── 01 · LOGO ──────────────────────────────────────────
  tl.to(s.logo, { glow: 0.35, duration: 6 }, 10);
  tl.to(s.env, { envi: 0.5, duration: 6 }, 10);
  tl.to($("[data-intro-cue]"), { autoAlpha: 0, duration: 2 }, 1);

  // ─── 02–05 · CAMERA, LENS, PASS THROUGH ────────────────
  tl.to(s.hero, { practicals: 1, duration: 5 }, 10);
  tl.to(s.hero, { lens: 1, duration: 5 }, 22);
  tl.to(s.fx, { bloom: 1.05, duration: 5 }, 25);
  tl.to(s.env, { exposure: 1.25, duration: 5 }, 26);
  tl.to(s.hero, { lens: 0.25, practicals: 0.4, duration: 4 }, 35);
  tl.to(s.fx, { bloom: 0.75, duration: 4 }, 35);
  tl.to(s.env, { exposure: 1.15, duration: 4 }, 35);

  // ─── 06 · MEDIA PRODUCTION ──────────────────────────────
  tl.to(s.media, { on: 1, duration: 4, ease: "power3.out" }, 37);

  // ─── 07 · DRONE — spins up, lifts, turns, then climbs away
  tl.to(s.drone, { spin: 1, duration: 2.5, ease: "power2.in" }, 45);
  tl.to(s.drone, { y: 1.9, duration: 4, ease: "power2.inOut" }, 47);
  tl.to(s.drone, { yaw: -0.35, duration: 6 }, 49);
  tl.to(s.drone, { y: 6.2, x: -1.8, z: -19.5, tilt: -0.28, duration: 4.5, ease: "power2.in" }, 55.5);

  // ─── 08 · EDIT ──────────────────────────────────────────
  tl.to(s.edit, { on: 1, duration: 4 }, 57);
  tl.to(s.edit, { play: 1, duration: 9, ease: "none" }, 60);
  tl.to(s.edit, { grade: 1, duration: 4 }, 63);

  // ─── 09 · SOCIAL & MOBILE ───────────────────────────────
  tl.to(s.phone, { on: 1, duration: 3 }, 68);
  tl.to(s.phone, { feed: 1, duration: 10, ease: "none" }, 70);
  tl.to(s.phone, { spin: 1.2, duration: 12, ease: "none" }, 68);

  // ─── 10 · STUDIO LIGHTING ───────────────────────────────
  const flicker = (p: number) => (p >= 1 ? 1 : Math.min(1, p * (0.35 + 0.65 * Math.abs(Math.sin(p * 37)))));
  tl.to(s.creative, { on: 1, duration: 3.5, ease: flicker }, 78.5);

  // ─── 11 · LOUNGE ────────────────────────────────────────
  tl.to(s.lounge, { on: 1, duration: 5 }, 88);
  tl.to(s.env.bg, { ...rgb("#07050c"), duration: 6 }, 88);

  // ─── COPY ───────────────────────────────────────────────
  const chapterIn = (id: string, at: number) => {
    const el = $(`[data-chapter="${id}"]`);
    if (!el) return;
    tl.fromTo(el.querySelectorAll("[data-line] > span"), { yPercent: 115 }, { yPercent: 0, duration: 3, stagger: 0.4, ease: "power3.out" }, at);
    tl.fromTo(el.querySelectorAll("[data-bar]"), { scaleX: 0 }, { scaleX: 1, duration: 2.5, ease: "power3.out" }, at + 0.8);
    tl.fromTo(el.querySelectorAll("[data-fade]"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 2.5, stagger: 0.3, ease: "power2.out" }, at + 1);
  };
  const chapterOut = (id: string, at: number) =>
    tl.to($(`[data-chapter="${id}"]`), { autoAlpha: 0, y: mobile ? -20 : -40, duration: 2.5, ease: "power2.in" }, at);
  chapterIn("media", 40.5);
  chapterOut("media", 47.5);
  chapterIn("drone", 50);
  chapterOut("drone", 57);
  chapterIn("edit", 61);
  chapterOut("edit", 68);
  chapterIn("social", 71.5);
  chapterOut("social", 78.5);
  chapterIn("creative", 82);
  chapterOut("creative", 89);

  // ─── HANDOFF — the page content scrolls over the lounge ─
  tl.to($("[data-hud]"), { autoAlpha: 0, duration: 4 }, 95);
  tl.set({}, {}, 100);

  return tl;
}
