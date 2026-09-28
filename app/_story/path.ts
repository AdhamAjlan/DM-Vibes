// ═══════════════════════════════════════════════════════════
// CAMERA PATH — the storyteller.
// One continuous Catmull-Rom spline through one studio. `t` is the story
// percentage at which the camera passes each key; the timeline tweens
// state.cam.k between key indices so the camera never stops dead.
//
// World layout (metres, the camera travels down -Z through a dark hangar):
//   z  7     01 the 3D DM VIBES logo
//   z -1     02–05 the cinema camera rig — we fly INTO its lens and out the back
//   z -9     06 media production set (softbox, director's chair, camera)
//   z -15.5  07 drone over its helipad
//   z -21.5  08 edit desk, two monitors
//   z -27    09 the phone
//   z -32.5  10 creative / lighting set
//   z -41    11 the lounge — the page content scrolls over this frame
// ═══════════════════════════════════════════════════════════

export type Vec3 = [number, number, number];
export type CamKey = { t: number; pos: Vec3; look: Vec3 };

export const LOGO_Z = 7;
export const HERO: Vec3 = [0, 0, -1];
export const HERO_PAN_Y = 1.12;
export const HERO_SIZE = 1.4;
// Measured from camera.glb: lens axis is centred, front at +0.4, body back at -0.4
// (model units at size 0.8) → scaled by HERO_SIZE / 0.8.
const K = HERO_SIZE / 0.8;
export const LENS = {
  y: HERO_PAN_Y + 0.182 * K,
  front: HERO[2] + 0.4 * K,
  back: HERO[2] - 0.4 * K,
  radius: 0.12 * K,
};
export const MEDIA: Vec3 = [1.6, 0, -9];
export const PAD: Vec3 = [0.8, 0, -15.5];
export const DESK: Vec3 = [-1.6, 0, -21.5];
export const PHONE: Vec3 = [1.0, 1.85, -27];
export const CREATIVE: Vec3 = [2.6, 0, -32.5];
export const LOUNGE: Vec3 = [-1.8, 0, -41.5];

const L = LENS.y;

export const CAM_KEYS: CamKey[] = [
  // 01 · logo reveal
  { t: 0, pos: [0, 1.45, 17], look: [0, 1.5, LOGO_Z] },
  { t: 6, pos: [0, 1.5, 13.2], look: [0, 1.5, LOGO_Z] },
  // 02 · crane over the logo — the camera appears
  { t: 11, pos: [0, 3.1, 9.4], look: [0, 1.4, 0] },
  { t: 16, pos: [1.9, 2.0, 2.6], look: [0, 1.4, -1] },
  // 03 · move closer
  { t: 21, pos: [1.0, 1.6, 1.0], look: [0, L, -0.6] },
  // 04 · lens close-up
  { t: 26, pos: [0.02, L, 0.75], look: [0, L, -2] },
  { t: 31, pos: [0, L, LENS.front + 0.12], look: [0, L, -3] },
  // 05 · pass through
  { t: 35, pos: [0, L, LENS.back + 0.45], look: [0, L, -6] },
  { t: 39, pos: [0, 1.6, -3.6], look: [0.8, 1.3, -9] },
  // 06 · media production
  { t: 44, pos: [-1.6, 1.7, -4.8], look: [1.6, 1.2, -9] },
  // 07 · drone
  { t: 49, pos: [-1.3, 1.95, -11.9], look: [0.8, 1.8, -15.5] },
  { t: 55, pos: [-0.2, 2.25, -12.7], look: [0.8, 2.0, -15.5] },
  // 08 · video editing
  { t: 60, pos: [1.6, 1.7, -17.6], look: [-1.6, 1.1, -21.5] },
  { t: 66, pos: [0.6, 1.45, -19.3], look: [-1.6, 1.1, -21.6] },
  // 09 · social & mobile
  { t: 71, pos: [-1.1, 1.8, -23.4], look: [1.0, 1.85, -27] },
  { t: 76, pos: [-0.5, 1.85, -24.6], look: [1.0, 1.85, -27] },
  // 10 · studio lighting / creative design
  { t: 81, pos: [-1.2, 1.75, -28.8], look: [2.2, 1.5, -32.5] },
  { t: 86, pos: [-0.6, 1.8, -29.8], look: [2.2, 1.5, -32.8] },
  // 11 · the lounge
  { t: 93, pos: [0.4, 2.1, -33.8], look: [-0.8, 1.3, -43] },
  { t: 100, pos: [0.3, 1.9, -35.4], look: [-0.9, 1.4, -43] },
];
