import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Themeable accent (driven by --accent CSS var, supports /opacity)
        accent: "rgb(var(--accent) / <alpha-value>)",
        // Per-platform brand accents (challenge spec)
        twitch: "#9146FF",
        kick: "#53FC18",
        x: "#E7E9EA",
        // App surfaces — deep "premium dark"
        ink: {
          950: "#08090c",
          900: "#0c0e13",
          850: "#11141b",
          800: "#161a23",
          700: "#1f2430",
        },
        bull: "#22c55e",
        bear: "#ef4444",
        gold: "#e3b341",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      keyframes: {
        slideIn: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        "slide-in": "slideIn 0.18s cubic-bezier(0.16,1,0.3,1) forwards",
        "pulse-dot": "pulseDot 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
