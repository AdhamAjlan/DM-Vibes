import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050507",
        amber: { DEFAULT: "#ffc107" },
      },
    },
  },
  plugins: [],
};
export default config;