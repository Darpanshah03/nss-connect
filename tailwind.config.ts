import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Theme-aware tokens — resolve differently in light vs dark via CSS vars
        paper: "rgb(var(--paper) / <alpha-value>)",     // page background
        surface: "rgb(var(--surface) / <alpha-value>)", // card background
        surface2: "rgb(var(--surface-2) / <alpha-value>)",
        steel: "rgb(var(--steel) / <alpha-value>)",      // borders
        ink: "rgb(var(--ink) / <alpha-value>)",          // text (use ink/70, ink/50 etc for muted)
        saffron: "rgb(var(--saffron) / <alpha-value>)",
        green: "rgb(var(--green) / <alpha-value>)",
        wheelred: "rgb(var(--wheelred) / <alpha-value>)",

        // Fixed, non-theme-reactive — used sparingly (e.g. brand mark)
        navy: "#0A1A3F",

        // Legacy aliases, now theme-aware automatically
        slateink: "rgb(var(--ink) / <alpha-value>)",
        brandblue: "rgb(var(--saffron) / <alpha-value>)",
        brandblueDark: "#CC5E00",
        brandred: "rgb(var(--wheelred) / <alpha-value>)",
        brandgreen: "rgb(var(--green) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;