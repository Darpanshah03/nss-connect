import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10172A",
        paper: "#F1F3F6",
        brandblue: "#1E4FD8",
        brandblueDark: "#123199",
        brandred: "#E8542C",
        brandgreen: "#1F9D6C",
        slateink: "#64748B",
      },
    },
  },
  plugins: [],
};
export default config;
