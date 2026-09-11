import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],

  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
      },

      colors: {
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",

  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",

  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
  },

  secondary: {
    DEFAULT: "hsl(var(--secondary))",
    foreground: "hsl(var(--secondary-foreground))",
  },

  destructive: {
    DEFAULT: "hsl(var(--destructive))",
    foreground: "hsl(var(--destructive-foreground))",
  },

  muted: {
    DEFAULT: "hsl(var(--muted))",
    foreground: "hsl(var(--muted-foreground))",
  },

  accent: {
    DEFAULT: "hsl(var(--accent))",
    foreground: "hsl(var(--accent-foreground))",
  },

  card: {
    DEFAULT: "hsl(var(--card))",
    foreground: "hsl(var(--card-foreground))",
  },

  popover: {
    DEFAULT: "hsl(var(--popover))",
    foreground: "hsl(var(--popover-foreground))",
  },

  navy: "hsl(var(--navy))",
  saffron: "hsl(var(--saffron))",
  steel: "hsl(var(--steel))",
  paper: "hsl(var(--paper))",
  wheelred: "hsl(var(--wheelred))",

  brandblue: "hsl(var(--brandblue))",
  brandblueDark: "hsl(var(--brandblueDark))",
  slateink: "hsl(var(--slateink))",

  brandgreen: "hsl(var(--brandgreen))",
  brandorange: "hsl(var(--brandorange))",

  tricolour: {
    orange: "hsl(var(--tricolour-orange))",
    green: "hsl(var(--tricolour-green))",
    blue: "hsl(var(--tricolour-blue))",
  },
},

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      keyframes: {
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(8px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },

      animation: {
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },

  plugins: [require("tailwindcss-animate")],
};

export default config;