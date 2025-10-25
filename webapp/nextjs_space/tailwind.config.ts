
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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#0A1F3D",
          50: "#E8EDF4",
          100: "#C5D3E6",
          200: "#9FB5D6",
          300: "#7897C6",
          400: "#5C80BA",
          500: "#4069AE",
          600: "#355A99",
          700: "#294881",
          800: "#1D3669",
          900: "#0A1F3D",
          foreground: "#FFFFFF",
        },
        coral: {
          DEFAULT: "#FF6B6B",
          50: "#FFE9E9",
          100: "#FFC9C9",
          200: "#FFA5A5",
          300: "#FF8080",
          400: "#FF6B6B",
          500: "#FF5555",
          600: "#FF3838",
          700: "#FF1A1A",
          800: "#E60000",
          900: "#B30000",
        },
        gold: {
          DEFAULT: "#FFD166",
          50: "#FFF8E6",
          100: "#FFEDC2",
          200: "#FFE19A",
          300: "#FFD672",
          400: "#FFD166",
          500: "#FFC233",
          600: "#FFB300",
          700: "#E69F00",
          800: "#CC8C00",
          900: "#996900",
        },
        emerald: {
          DEFAULT: "#06D6A0",
          50: "#E6FBF5",
          100: "#B3F4E0",
          200: "#80EDCB",
          300: "#4DE6B6",
          400: "#1ADFA1",
          500: "#06D6A0",
          600: "#05B888",
          700: "#049B70",
          800: "#037D58",
          900: "#025F40",
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
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "count-up": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in-left": "slide-in-left 0.6s ease-out",
        "slide-in-right": "slide-in-right 0.6s ease-out",
        "count-up": "count-up 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
