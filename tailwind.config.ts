import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        manrope: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        "text-dark": "#eae9fc",
        "background-dark": "#000005",
        "primary-dark": "#3feece",
        "secondary-dark": "#91caee",
        "accent-dark": "#b8b2e1",
        "text": "#040316",
        "background": "#fafaff",
        "primary": "#11c0a0",
        "secondary": "#114b6e",
        "accent": "#241e4d",
      },
    },
  },
  plugins: [],
};

export default config;