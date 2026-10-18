/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#10b981",
          dark: "#059669",
          light: "#34d399",
        },
        secondary: {
          DEFAULT: "#3b82f6",
        },
        danger: {
          DEFAULT: "#ef4444",
        },
        base: {
          DEFAULT: "var(--color-base)",
          card: "var(--color-card)",
          border: "var(--color-border)",
        },
        text: {
          DEFAULT: "var(--color-text)",
          strong: "var(--color-text-strong)",
          soft: "var(--color-text-soft)",
          muted: "var(--color-text-muted)",
          faint: "var(--color-text-faint)",
        },
        slate: {
          100: "var(--color-text)",
          200: "var(--color-text-strong)",
          300: "var(--color-text-soft)",
          400: "var(--color-text-muted)",
          500: "var(--color-text-faint)",
          900: "var(--color-base)",
        },
      },
    },
  },
  plugins: [],
};
