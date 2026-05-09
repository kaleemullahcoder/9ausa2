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
      colors: {
        dark: {
          bg: "#020408", // Deep Navy Black
          card: "#050A14", // Dark Blue-Grey
          hover: "#0A1428", // Lighter Navy
          border: "#112240",
        },
        blue: {
          primary: "#3b82f6",
          secondary: "#60a5fa",
          accent: "#93c5fd",
          glow: "#2563eb",
          dark: "#1e3a8a",
        },
        green: {
          primary: "#10b981", // Emerald 500
          secondary: "#34d399", // Emerald 400
          accent: "#6ee7b7", // Emerald 300
          glow: "#059669",
        },
        brand: {
          primary: "#0ea5e9", // Sky Blue
          secondary: "#10b981", // Emerald Green
          accent: "#06b6d4", // Cyan
          etoro: "#00a200", // eToro Green
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "blue-gradient": "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)",
        "ocean-gradient": "linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)", // Blue to Green
        "glass-gradient": "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
        "active-gradient": "linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0) 100%)", // Green tint
      },
      boxShadow: {
        "blue-glow": "0 0 20px rgba(59, 130, 246, 0.3)",
        "green-glow": "0 0 20px rgba(16, 185, 129, 0.3)",
        "glass": "0 4px 30px rgba(0, 0, 0, 0.1)",
        "neon": "0 0 5px theme('colors.blue.500'), 0 0 20px theme('colors.blue.900')",
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
};
export default config;
