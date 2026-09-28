// ═══════════════════════════════════════════════════════════
// SITE DATA — shared by the story, sections and the clients view
// ═══════════════════════════════════════════════════════════

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/dmvibes.eg?stkn=MWJ1dmlqMDd2eG9tbQ==",
  facebook: "https://www.facebook.com/share/18QWAWGEG9/?mibextid=wwXIfr",
  linkedin: "https://www.linkedin.com/company/dmvibes/",
  x: "https://x.com/dmvibes_eg",
};

export const PROJECT_SERVICES = [
  "Digital Marketing",
  "Media Production",
  "Web Development",
  "Market Research",
  "Search Engine Optimization",
] as const;

export const CONTACT_INFO = {
  office: "13 AlBustan, DownTown Cairo",
  email: "marketing@dmvibes.com",
  phone: "+201000066932",
} as const;

export const DM_CLIENTS: Array<{ name: string; category: string; accent: string; logo: string }> = [
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

// Story chapters (the storyboard). `from` is where the chapter takes over the
// HUD, `at` is where it reads best — used by the HUD and every "jump to" link.
export const CHAPTERS = [
  { id: "start", no: "01", label: ["Start", "Logo Reveal"], from: 0, at: 0 },
  { id: "camera", no: "02", label: ["Camera", "Appears"], from: 0.1, at: 0.16 },
  { id: "closer", no: "03", label: ["Move", "Closer"], from: 0.17, at: 0.21 },
  { id: "lens", no: "04", label: ["Lens", "Close-up"], from: 0.24, at: 0.28 },
  { id: "through", no: "05", label: ["Pass", "Through"], from: 0.31, at: 0.35 },
  { id: "media", no: "06", label: ["Media", "Production"], from: 0.38, at: 0.445 },
  { id: "drone", no: "07", label: ["Drone", "Section"], from: 0.48, at: 0.54 },
  { id: "edit", no: "08", label: ["Editing", "Section"], from: 0.58, at: 0.645 },
  { id: "social", no: "09", label: ["Social", "& Mobile"], from: 0.68, at: 0.755 },
  { id: "creative", no: "10", label: ["Studio", "Lighting"], from: 0.78, at: 0.855 },
  { id: "final", no: "11", label: ["Final", "Section"], from: 0.9, at: 1 },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]["id"];

/** Opens the visitor's mail app with the brief filled in — the form really reaches the studio. */
export function sendBrief(fields: Record<string, string>) {
  const body = Object.entries(fields)
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  const subject = `Project enquiry${fields.Name ? ` — ${fields.Name}` : ""}`;
  window.location.href = `mailto:${CONTACT_INFO.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
