// ═══════════════════════════════════════════════════════════
// QUALITY — the same film on every device, smarter rendering on phones.
// Mobile keeps the camera path, the objects and the timeline; it drops
// shadows, post-processing, extra lights, texture resolution and DPR.
// ═══════════════════════════════════════════════════════════
export type Quality = {
  mobile: boolean;
  models: "hd" | "sd";
  shadows: boolean;
  post: boolean;
  dpr: [number, number];
  dust: number;
  extraLights: boolean;
};

export function detectQuality(): Quality {
  // ?quality=high|low forces a tier (handy for testing either path on any device).
  const forced = new URLSearchParams(window.location.search).get("quality");
  const mobile = forced ? forced === "low" : window.matchMedia("(max-width: 820px), (pointer: coarse)").matches;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  if (mobile) {
    return {
      mobile: true,
      models: "sd",
      shadows: false,
      post: false,
      dpr: [1, memory <= 4 ? 1.25 : 1.5],
      dust: 140,
      extraLights: false,
    };
  }
  return { mobile: false, models: "hd", shadows: true, post: true, dpr: [1, 1.75], dust: 420, extraLights: true };
}

export type FrameGate = { current: ((mode: "always" | "never") => void) | null };
