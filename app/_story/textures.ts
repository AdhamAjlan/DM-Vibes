import * as THREE from "three";

// ═══════════════════════════════════════════════════════════
// PROCEDURAL TEXTURES
// Everything on a screen in the world is drawn on a canvas, so the content
// itself can be driven by the scroll timeline (playhead, grade, likes…).
// ═══════════════════════════════════════════════════════════

const fontVar = (name: string, fallback: string) => {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? `${v}, ${fallback}` : fallback;
};
const SANS = () => fontVar("--font-inter-tight", "system-ui, sans-serif");

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext("2d")! };
}

function toTexture(c: HTMLCanvasElement, flipY = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = flipY;
  t.anisotropy = 4;
  return t;
}

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const timecode = (seconds: number) => {
  const f = Math.floor((seconds % 1) * 24);
  const s = Math.floor(seconds) % 60;
  const m = Math.floor(seconds / 60) % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return `00:${p(m)}:${p(s)}:${p(f)}`;
};

// ───────────────────────────────────────────────────────────
// EDIT BAY MONITOR — timeline playhead + colour grade follow the scroll
// ───────────────────────────────────────────────────────────
export function createMonitorScreen() {
  const W = 1024;
  const H = 624;
  const { c, ctx } = canvas(W, H);
  const texture = toTexture(c);

  const rnd = seeded(7);
  const skyline = Array.from({ length: 26 }, (_, i) => ({ x: i / 26, w: 0.03 + rnd() * 0.04, h: 0.12 + rnd() * 0.3 }));
  const scope = Array.from({ length: 150 }, () => rnd());
  const tracks: { name: string; color: string; clips: [number, number, string][] }[] = [
    { name: "V3", color: "#8b5cf6", clips: [[0.06, 0.2, "TITLE"], [0.55, 0.7, "LOWER 3RD"]] },
    { name: "V2", color: "#5b7cff", clips: [[0.18, 0.42, "B-ROLL_DRONE"], [0.62, 0.9, "B-ROLL_CITY"]] },
    { name: "V1", color: "#3b82f6", clips: [[0.0, 0.28, "A001_C004"], [0.28, 0.52, "A001_C011"], [0.52, 0.78, "A002_C003"], [0.78, 1, "A002_C009"]] },
    { name: "A1", color: "#10b981", clips: [[0.0, 0.52, "VO_FINAL"], [0.52, 1, "VO_FINAL"]] },
    { name: "A2", color: "#14b8a6", clips: [[0.0, 1, "SCORE — GOOD VIBES"]] },
  ];

  let last = "";
  function draw(play: number, grade: number) {
    const key = `${Math.round(play * 500)}:${Math.round(grade * 60)}`;
    if (key === last) return;
    last = key;
    const sans = SANS();

    ctx.fillStyle = "#07090f";
    ctx.fillRect(0, 0, W, H);

    // header
    ctx.fillStyle = "#0d111b";
    ctx.fillRect(0, 0, W, 32);
    ["#ff5f57", "#febc2e", "#28c840"].forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(18 + i * 18, 16, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.font = `500 13px ${sans}`;
    ctx.fillStyle = "#8a93b0";
    ctx.fillText("DMV — MASTER_EDIT_v12  ·  4K 24p", 82, 21);
    ctx.fillStyle = "#ff4d6d";
    ctx.fillText("● REC", W - 70, 21);

    // viewer
    const vx = 16, vy = 46, vw = 600, vh = 338;
    const g = ctx.createLinearGradient(0, vy, 0, vy + vh);
    g.addColorStop(0, "#0c1433");
    g.addColorStop(0.55, "#ff6a3d");
    g.addColorStop(0.72, "#ffb070");
    g.addColorStop(1, "#1a0f2e");
    ctx.fillStyle = g;
    ctx.fillRect(vx, vy, vw, vh);
    const sun = ctx.createRadialGradient(vx + vw * 0.66, vy + vh * 0.62, 4, vx + vw * 0.66, vy + vh * 0.62, 90);
    sun.addColorStop(0, "rgba(255,236,200,1)");
    sun.addColorStop(0.3, "rgba(255,190,120,0.8)");
    sun.addColorStop(1, "rgba(255,120,60,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(vx, vy, vw, vh);
    ctx.fillStyle = "#07060d";
    skyline.forEach((b) => ctx.fillRect(vx + b.x * vw, vy + vh * (0.82 - b.h), b.w * vw, vh * b.h + vh * 0.2));
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = `700 46px ${sans}`;
    ctx.textAlign = "center";
    ctx.fillText("WE MADE VIBES", vx + vw / 2, vy + vh * 0.42);
    ctx.textAlign = "left";
    // flat LOG look → graded look
    ctx.globalCompositeOperation = "saturation";
    ctx.fillStyle = `rgba(128,128,128,${0.92 * (1 - grade)})`;
    ctx.fillRect(vx, vy, vw, vh);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(92,96,110,${0.38 * (1 - grade)})`;
    ctx.fillRect(vx, vy, vw, vh);
    // letterbox
    ctx.fillStyle = "#000";
    ctx.fillRect(vx, vy, vw, 30);
    ctx.fillRect(vx, vy + vh - 30, vw, 30);
    ctx.font = `600 12px ${sans}`;
    ctx.fillStyle = grade > 0.5 ? "#7ee0b5" : "#9aa3bd";
    ctx.fillText(grade > 0.5 ? "GRADED · DMV LUT 03" : "LOG-C · UNGRADED", vx + 12, vy + 20);
    ctx.fillStyle = "#e6e9f5";
    ctx.textAlign = "right";
    ctx.fillText(timecode(play * 150), vx + vw - 12, vy + vh - 11);
    ctx.textAlign = "left";

    // colour panel
    const px = 632;
    ctx.fillStyle = "#0b0e17";
    rrect(ctx, px, 46, 376, 338, 10);
    ctx.fill();
    ctx.fillStyle = "#8a93b0";
    ctx.font = `600 12px ${sans}`;
    ctx.fillText("COLOUR · WHEELS", px + 16, 70);
    const wheels = [
      { label: "LIFT", dx: -0.35, dy: 0.25 },
      { label: "GAMMA", dx: 0.1, dy: -0.3 },
      { label: "GAIN", dx: 0.4, dy: 0.2 },
    ];
    wheels.forEach((w, i) => {
      const cx = px + 70 + i * 118;
      const cy = 142;
      const wheel = ctx.createConicGradient(0, cx, cy);
      ["#ff4d6d", "#ffd166", "#06d6a0", "#118ab2", "#8b5cf6", "#ff4d6d"].forEach((col, j, a) => wheel.addColorStop(j / (a.length - 1), col));
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = wheel;
      ctx.beginPath();
      ctx.arc(cx, cy, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(7,9,15,0.55)";
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cx + w.dx * 34 * grade, cy + w.dy * 34 * grade, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#8a93b0";
      ctx.textAlign = "center";
      ctx.fillText(w.label, cx, cy + 64);
      ctx.textAlign = "left";
    });
    // waveform scope
    const sy0 = 236, sh = 130;
    ctx.fillStyle = "#06080d";
    ctx.fillRect(px + 16, sy0, 344, sh);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(px + 16, sy0 + (sh * i) / 4);
      ctx.lineTo(px + 360, sy0 + (sh * i) / 4);
      ctx.stroke();
    }
    const contrast = 0.35 + grade * 0.6;
    scope.forEach((v, i) => {
      const x = px + 18 + (i / scope.length) * 340;
      const mid = sy0 + sh / 2;
      const h = (v - 0.5) * sh * contrast + Math.sin(i * 0.19) * 10;
      ctx.fillStyle = i % 3 === 0 ? "rgba(255,90,110,0.55)" : i % 3 === 1 ? "rgba(90,230,160,0.55)" : "rgba(100,150,255,0.6)";
      ctx.fillRect(x, mid - Math.abs(h), 1.6, Math.abs(h) * 2 * (0.5 + v * 0.5));
    });

    // timeline
    const tx = 64, ty = 402, tw = W - tx - 16;
    ctx.fillStyle = "#0b0e17";
    ctx.fillRect(0, ty - 8, W, H - ty + 8);
    ctx.fillStyle = "#5d6582";
    ctx.font = `500 10px ${sans}`;
    for (let i = 0; i <= 10; i++) {
      const x = tx + (tw * i) / 10;
      ctx.fillRect(x, ty, 1, i % 2 ? 5 : 9);
      if (i % 2 === 0) ctx.fillText(timecode(i * 15).slice(3), x + 4, ty + 10);
    }
    tracks.forEach((track, r) => {
      const y = ty + 22 + r * 38;
      ctx.fillStyle = "#8a93b0";
      ctx.font = `600 12px ${sans}`;
      ctx.fillText(track.name, 18, y + 22);
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      ctx.fillRect(tx, y, tw, 32);
      track.clips.forEach(([a, b, name]) => {
        const active = play >= a && play <= b;
        ctx.fillStyle = track.color;
        ctx.globalAlpha = active ? 0.95 : 0.55;
        rrect(ctx, tx + a * tw + 1, y + 2, (b - a) * tw - 2, 28, 5);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = active ? "#fff" : "rgba(255,255,255,0.75)";
        ctx.font = `600 11px ${sans}`;
        ctx.fillText(name, tx + a * tw + 9, y + 20);
      });
    });
    const phx = tx + play * tw;
    ctx.fillStyle = "#ff4d6d";
    ctx.fillRect(phx - 1, ty - 6, 2, H - ty);
    ctx.beginPath();
    ctx.moveTo(phx - 7, ty - 8);
    ctx.lineTo(phx + 7, ty - 8);
    ctx.lineTo(phx, ty + 2);
    ctx.fill();

    texture.needsUpdate = true;
  }

  draw(0, 0);
  return { texture, draw };
}

// Second edit-bay screen: full viewer + scopes, graded by the scroll
export function createGradeScreen() {
  const W = 1024;
  const H = 624;
  const { c, ctx } = canvas(W, H);
  const texture = toTexture(c);
  const rnd = seeded(3);
  const scope = Array.from({ length: 220 }, () => rnd());
  let last = -1;
  function draw(grade: number) {
    const key = Math.round(grade * 80);
    if (key === last) return;
    last = key;
    const sans = SANS();
    ctx.fillStyle = "#06070c";
    ctx.fillRect(0, 0, W, H);
    // viewer: a studio portrait silhouette against a lit backdrop
    const vx = 20, vy = 20, vw = W - 40, vh = 400;
    const bg = ctx.createRadialGradient(vx + vw * 0.55, vy + vh * 0.45, 20, vx + vw * 0.55, vy + vh * 0.45, vw * 0.6);
    bg.addColorStop(0, "#ffb778");
    bg.addColorStop(0.45, "#6b3cff");
    bg.addColorStop(1, "#0a0820");
    ctx.fillStyle = bg;
    ctx.fillRect(vx, vy, vw, vh);
    ctx.fillStyle = "#07060d";
    ctx.beginPath();
    ctx.ellipse(vx + vw * 0.55, vy + vh * 0.42, 62, 76, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(vx + vw * 0.55, vy + vh * 1.02, 190, 200, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "saturation";
    ctx.fillStyle = `rgba(128,128,128,${0.9 * (1 - grade)})`;
    ctx.fillRect(vx, vy, vw, vh);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(95,98,110,${0.35 * (1 - grade)})`;
    ctx.fillRect(vx, vy, vw, vh);
    ctx.font = `600 13px ${sans}`;
    ctx.fillStyle = grade > 0.5 ? "#7ee0b5" : "#9aa3bd";
    ctx.fillText(grade > 0.5 ? "GRADED · DMV LUT 03" : "LOG-C · UNGRADED", vx + 14, vy + 24);
    // scopes
    ctx.fillStyle = "#0b0d16";
    ctx.fillRect(20, 440, W - 40, 164);
    scope.forEach((v, i) => {
      const x = 30 + (i / scope.length) * (W - 60);
      const hgt = (0.3 + v * 0.7) * 120 * (0.45 + grade * 0.55);
      ctx.fillStyle = i % 3 === 0 ? "rgba(255,90,110,0.6)" : i % 3 === 1 ? "rgba(90,230,160,0.6)" : "rgba(110,140,255,0.7)";
      ctx.fillRect(x, 590 - hgt, 2, hgt * (0.4 + v * 0.3));
    });
    texture.needsUpdate = true;
  }
  draw(0);
  return { texture, draw };
}

// ───────────────────────────────────────────────────────────
// LABELS & SIGNS — flat text planes that live in the world
// ───────────────────────────────────────────────────────────
export function createLabelTexture(
  text: string,
  { w = 1024, h = 160, size = 72, weight = 300, spacing = 0.5, color = "#e8ecff", glow = "rgba(120,110,255,0.8)", bg = "", family = "sans" } = {}
) {
  const { c, ctx } = canvas(w, h);
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }
  const font = family === "logo" ? "Orbitron, " + SANS() : SANS();
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textBaseline = "middle";
  // manual letter-spacing (canvas letterSpacing is not everywhere yet)
  const chars = text.split("");
  const gap = size * spacing;
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (chars.length - 1);
  let x = (w - total) / 2;
  ctx.fillStyle = color;
  ctx.shadowColor = glow;
  ctx.shadowBlur = glow ? size * 0.35 : 0;
  chars.forEach((ch, i) => {
    ctx.fillText(ch, x, h / 2);
    x += widths[i] + gap;
  });
  return toTexture(c);
}

// Glowing "DM VIBES" screen / sign
export function createSignTexture(w = 1024, h = 512, bg = "#07061a") {
  const { c, ctx } = canvas(w, h);
  const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.6);
  g.addColorStop(0, "#1a1450");
  g.addColorStop(1, bg);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f4f5ff";
  ctx.shadowColor = "rgba(140,120,255,0.9)";
  ctx.shadowBlur = h * 0.06;
  ctx.font = `900 ${h * 0.32}px ${SANS()}`;
  ctx.fillText("DM", w / 2, h * 0.36);
  ctx.fillText("VIBES", w / 2, h * 0.66);
  return toTexture(c);
}

// Helipad marking on the studio floor
export function createHelipadTexture() {
  const S = 1024;
  const { c, ctx } = canvas(S, S);
  ctx.translate(S / 2, S / 2);
  ctx.strokeStyle = "rgba(200,210,255,0.9)";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(0, 0, S * 0.46, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([40, 28]);
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 0, S * 0.39, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 4;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(S * 0.3, 0);
    ctx.lineTo(S * 0.36, 0);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(220,226,255,0.95)";
  ctx.font = `900 ${S * 0.2}px ${SANS()}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("DM", 0, 0);
  const t = toTexture(c);
  return t;
}

// Hangar wall panels
export function createPanelTexture() {
  const W = 256;
  const H = 256;
  const { c, ctx } = canvas(W, H);
  ctx.fillStyle = "#0b0c14";
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, "rgba(255,255,255,0.03)");
  g.addColorStop(0.5, "rgba(255,255,255,0)");
  g.addColorStop(1, "rgba(0,0,0,0.25)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#04050a";
  ctx.fillRect(0, 0, 3, H);
  ctx.fillRect(0, 0, W, 2);
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ───────────────────────────────────────────────────────────
// SOCIAL GRID — the phone's profile feed, scrolled by the story
// ───────────────────────────────────────────────────────────
export function createSocialScreen() {
  const W = 600;
  const H = 1260;
  const { c, ctx } = canvas(W, H);
  const texture = toTexture(c);
  const rnd = seeded(21);
  const cols = 3;
  const tile = (W - 8) / cols;
  // pre-render the grid of "posts" once
  const rows = 8;
  const grid = canvas(W, rows * (tile + 4));
  const hues = [245, 265, 225, 290, 20, 205, 255, 330];
  for (let i = 0; i < rows * cols; i++) {
    const x = (i % cols) * (tile + 4);
    const y = Math.floor(i / cols) * (tile + 4);
    const g = grid.ctx;
    const hue = hues[i % hues.length] + rnd() * 20;
    const bg = g.createLinearGradient(x, y, x + tile, y + tile);
    bg.addColorStop(0, `hsl(${hue} 60% ${14 + rnd() * 10}%)`);
    bg.addColorStop(1, `hsl(${hue + 40} 70% ${6 + rnd() * 8}%)`);
    g.fillStyle = bg;
    g.fillRect(x, y, tile, tile);
    const kind = i % 4;
    g.save();
    g.beginPath();
    g.rect(x, y, tile, tile);
    g.clip();
    if (kind === 0) {
      // studio light flare
      const f = g.createRadialGradient(x + tile * 0.7, y + tile * 0.3, 2, x + tile * 0.7, y + tile * 0.3, tile * 0.6);
      f.addColorStop(0, "rgba(255,220,170,0.95)");
      f.addColorStop(1, "rgba(255,160,90,0)");
      g.fillStyle = f;
      g.fillRect(x, y, tile, tile);
      g.fillStyle = "rgba(5,5,12,0.9)";
      g.fillRect(x + tile * 0.25, y + tile * 0.45, tile * 0.18, tile * 0.55);
    } else if (kind === 1) {
      // skyline
      g.fillStyle = "rgba(4,4,12,0.95)";
      for (let b = 0; b < 7; b++) g.fillRect(x + (b / 7) * tile, y + tile * (0.45 + rnd() * 0.3), tile / 7 - 3, tile);
    } else if (kind === 2) {
      // bokeh
      for (let b = 0; b < 9; b++) {
        g.fillStyle = `hsla(${hue + rnd() * 60} 90% 70% / ${0.25 + rnd() * 0.4})`;
        g.beginPath();
        g.arc(x + rnd() * tile, y + rnd() * tile, 6 + rnd() * 22, 0, Math.PI * 2);
        g.fill();
      }
    } else {
      // big type post
      g.fillStyle = "rgba(255,255,255,0.92)";
      g.font = `800 ${tile * 0.2}px ${SANS()}`;
      g.fillText("GOOD", x + 14, y + tile * 0.55);
      g.fillText("VIBES", x + 14, y + tile * 0.76);
    }
    if (i % 5 === 2) {
      g.fillStyle = "rgba(255,255,255,0.9)";
      g.beginPath();
      g.moveTo(x + tile - 34, y + 14);
      g.lineTo(x + tile - 14, y + 26);
      g.lineTo(x + tile - 34, y + 38);
      g.fill();
    }
    g.restore();
  }

  let last = -1;
  function draw(feed: number) {
    const key = Math.round(feed * 400);
    if (key === last) return;
    last = key;
    const sans = SANS();
    ctx.fillStyle = "#04040a";
    ctx.fillRect(0, 0, W, H);
    const top = 330;
    ctx.drawImage(grid.c, 4, top - feed * (grid.c.height - (H - top - 110)));
    // profile header (fixed)
    ctx.fillStyle = "#04040a";
    ctx.fillRect(0, 0, W, top - 6);
    ctx.fillStyle = "#fff";
    ctx.font = `600 24px ${sans}`;
    ctx.fillText("9:41", 48, 60);
    ctx.fillStyle = "#000";
    rrect(ctx, W / 2 - 80, 26, 160, 46, 23);
    ctx.fill();
    const ring = ctx.createLinearGradient(40, 110, 150, 220);
    ring.addColorStop(0, "#5b3dff");
    ring.addColorStop(1, "#ff4fa3");
    ctx.strokeStyle = ring;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(96, 170, 52, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#0e0c26";
    ctx.beginPath();
    ctx.arc(96, 170, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `900 22px ${sans}`;
    ctx.textAlign = "center";
    ctx.fillText("DM", 96, 166);
    ctx.font = `700 12px ${sans}`;
    ctx.fillText("VIBES", 96, 186);
    ctx.textAlign = "left";
    ctx.font = `700 30px ${sans}`;
    ctx.fillText("dmvibes.eg", 176, 150);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = `400 20px ${sans}`;
    ctx.fillText("Creative Studio · Cairo", 176, 184);
    ctx.fillStyle = "#5b3dff";
    rrect(ctx, 34, 240, W / 2 - 44, 52, 14);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    rrect(ctx, W / 2 + 10, 240, W / 2 - 44, 52, 14);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `600 20px ${sans}`;
    ctx.textAlign = "center";
    ctx.fillText("Follow", 34 + (W / 2 - 44) / 2, 273);
    ctx.fillText("Message", W / 2 + 10 + (W / 2 - 44) / 2, 273);
    ctx.textAlign = "left";
    ctx.fillStyle = "#04040a";
    ctx.fillRect(0, H - 110, W, 110);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    [0.14, 0.32, 0.5, 0.68, 0.86].forEach((x) => {
      rrect(ctx, W * x - 16, H - 78, 32, 32, 8);
      ctx.fill();
    });
    texture.needsUpdate = true;
  }
  draw(0);
  return { texture, draw };
}
