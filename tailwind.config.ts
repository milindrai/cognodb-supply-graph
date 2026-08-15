import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0b0f19",
        panel: "#121826",
        panelalt: "#1a2234",
        edge: "#28324a",
        ink: "#e6eaf2",
        subtle: "#95a1b8",
        brand: "#5b8cff",
        ok: "#3ecf8e",
        warn: "#f5a524",
        danger: "#f04d6a",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
