/** @type {import('tailwindcss').Config} */
export default {
  // Tailwind が走査するファイルのパターン
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ─── カラーパレット拡張 ──────────────────────────────────────
      colors: {
        factory: {
          bg:      "#13131a",
          surface: "#1a1a24",
          panel:   "#111118",
          border:  "#1e1e2a",
          muted:   "#252535",
        },
        resource: {
          stone: "#A0AFBF",
          iron:  "#63B3ED",
          gear:  "#e0c070",
          coin:  "#F5C842",
        },
        power: {
          solar:   "#4ade80",
          battery: "#a78bfa",
          danger:  "#FC8181",
        },
        time: {
          day:   "#FCD34D",
          night: "#818CF8",
        },
      },

      // ─── フォントファミリー拡張 ──────────────────────────────────
      fontFamily: {
        mono: [
          "'Share Tech Mono'",
          "'Courier New'",
          "Consolas",
          "Menlo",
          "monospace",
        ],
        system: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },

      // ─── アニメーション拡張 ──────────────────────────────────────
      animation: {
        "fade-in-up":  "fadeInUp 0.25s ease forwards",
        "pulse-glow":  "pulseGlow 2s ease-in-out infinite",
        "belt-flow":   "beltFlow 0.5s ease-out",
        "hub-pulse":   "hubPulse 2s ease-in-out infinite",
        "star-twinkle":"starTwinkle 2s ease-in-out infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.8" },
          "50%":      { opacity: "1" },
        },
        beltFlow: {
          "0%":   { opacity: "0", transform: "scale(0.5)" },
          "40%":  { opacity: "1", transform: "scale(1.1)" },
          "100%": { opacity: "0.6", transform: "scale(0.9)" },
        },
        hubPulse: {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%":      { opacity: "0.7", transform: "scale(1.04)" },
        },
        starTwinkle: {
          "0%, 100%": { opacity: "0.2", transform: "scale(1)" },
          "50%":      { opacity: "0.9", transform: "scale(1.4)" },
        },
      },

      // ─── ボーダー半径 ────────────────────────────────────────────
      borderRadius: {
        "tile": "8px",
      },

      // ─── Spacing（グリッドのギャップなど） ───────────────────────
      spacing: {
        "tile-gap": "5px",
      },
    },
  },
  plugins: [],
};
