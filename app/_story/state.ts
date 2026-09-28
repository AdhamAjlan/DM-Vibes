// ═══════════════════════════════════════════════════════════
// STORY STATE
// A plain mutable object. The GSAP master timeline is the ONLY writer
// (plus the one-off opening reveal `intro`); the 3D scene reads it every
// frame. Because the timeline is scrubbed by scroll, every value is a pure
// function of the scroll position — stop scrolling and the world stops,
// scroll back and it rewinds.
// ═══════════════════════════════════════════════════════════

export type RGB = { r: number; g: number; b: number };

export const rgb = (hex: string): RGB => {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
};

export function createStoryState() {
  return {
    progress: 0,
    intro: 0, // opening lights-up on page load (time-based, once)
    // k = position along the camera spline (index space of CAM_KEYS)
    // sx/sy = composition offset (fraction of the frame) so subjects sit beside the copy
    cam: { k: 0, fov: 36, sx: 0, sy: 0 },
    logo: { glow: 1 },
    hero: { practicals: 0.35, lens: 0.2 },
    media: { on: 0 },
    drone: { y: 0.02, spin: 0, yaw: 0.6, x: 0.8, z: -15.5, tilt: 0 },
    edit: { on: 0, play: 0, grade: 0 },
    phone: { on: 0, feed: 0, spin: 0.5 },
    creative: { on: 0 },
    lounge: { on: 0 },
    // the roaming key light travels with the story from set to set
    key: { x: 0, y: 5.5, z: 13.5, tx: 0, ty: 1.5, tz: 7, i: 1.4, ...rgb("#dfe5ff") },
    fill: { x: -3, y: 2.5, z: 10, i: 0.8, ...rgb("#6f5bff") },
    env: { bg: rgb("#030309"), density: 0.03, envi: 0.9, exposure: 1.15 },
    fx: { bloom: 0.7 },
  };
}

export type StoryState = ReturnType<typeof createStoryState>;
