import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        manrope: ["var(--font-manrope)", "system-ui", "sans-serif"],
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
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // ZuboPets Brand Colors
        "zubo-primary": {
          DEFAULT: "#253347", // Royal Midnight Blue
          50: "#E8EBF0",
          100: "#D1D7E0",
          200: "#A3B0C0",
          300: "#7588A0",
          400: "#476180",
          500: "#253347", // DEFAULT
          600: "#1F2A3A",
          700: "#19222E",
          800: "#131923",
          900: "#0D1117",
          950: "#06080B",
        },
        "zubo-background": {
          DEFAULT: "#FBF9F6", // Porcelain White
          50: "#FFFFFF",
          100: "#FDFCFB",
          200: "#FBF9F6", // DEFAULT
          300: "#F8F6F3",
          400: "#F6F4F0",
          500: "#F3F1ED",
          600: "#C4C2BF",
          700: "#949290",
          800: "#656361",
          900: "#353432",
          950: "#1C1B1A",
        },
        "zubo-highlight-1": {
          DEFAULT: "#E7A79D", // Blush Coral
          50: "#FDF4F3",
          100: "#FBE9E6",
          200: "#F7D4CE",
          300: "#F2BFA5",
          400: "#EDAA9D",
          500: "#E7A79D", // DEFAULT
          600: "#D1968C",
          700: "#BB857B",
          800: "#A5746A",
          900: "#8F6359",
          950: "#795248",
        },
        "zubo-highlight-2": {
          DEFAULT: "#B8835C", // Bronze Clay
          50: "#F8F2ED",
          100: "#F1E5DB",
          200: "#E4CCB7",
          300: "#D6B393",
          400: "#C99A6F",
          500: "#B8835C", // DEFAULT
          600: "#A67652",
          700: "#946948",
          800: "#825C3E",
          900: "#704F34",
          950: "#5E422A",
        },
        "zubo-accent": {
          DEFAULT: "#AAB89B", // Soft Moss Green
          50: "#F5F7F3",
          100: "#EBF0E7",
          200: "#D7E0CE",
          300: "#C3D0B5",
          400: "#AFC19C",
          500: "#AAB89B", // DEFAULT
          600: "#99A78C",
          700: "#88967D",
          800: "#77856E",
          900: "#66745F",
          950: "#556350",
        },
        "zubo-text": {
          DEFAULT: "#2D2D2D", // Graphite Gray
          50: "#F0F0F0",
          100: "#E0E0E0",
          200: "#C0C0C0",
          300: "#A0A0A0",
          400: "#808080",
          500: "#606060",
          600: "#404040",
          700: "#2D2D2D", // DEFAULT
          800: "#1A1A1A",
          900: "#0D0D0D",
          950: "#000000",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
