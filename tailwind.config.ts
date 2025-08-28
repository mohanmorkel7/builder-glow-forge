import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Aura Oasis wellness colors
        wellness: {
          50: "hsl(var(--wellness-50))",
          100: "hsl(var(--wellness-100))",
          200: "hsl(var(--wellness-200))",
          300: "hsl(var(--wellness-300))",
          400: "hsl(var(--wellness-400))",
          500: "hsl(var(--wellness-500))",
          600: "hsl(var(--wellness-600))",
          700: "hsl(var(--wellness-700))",
          800: "hsl(var(--wellness-800))",
          900: "hsl(var(--wellness-900))",
        },
        sage: {
          50: "hsl(var(--sage-50))",
          100: "hsl(var(--sage-100))",
          200: "hsl(var(--sage-200))",
          300: "hsl(var(--sage-300))",
          400: "hsl(var(--sage-400))",
          500: "hsl(var(--sage-500))",
          600: "hsl(var(--sage-600))",
          700: "hsl(var(--sage-700))",
          800: "hsl(var(--sage-800))",
          900: "hsl(var(--sage-900))",
        },
        ocean: {
          50: "hsl(var(--ocean-50))",
          100: "hsl(var(--ocean-100))",
          200: "hsl(var(--ocean-200))",
          300: "hsl(var(--ocean-300))",
          400: "hsl(var(--ocean-400))",
          500: "hsl(var(--ocean-500))",
          600: "hsl(var(--ocean-600))",
          700: "hsl(var(--ocean-700))",
          800: "hsl(var(--ocean-800))",
          900: "hsl(var(--ocean-900))",
        },
        sand: {
          50: "hsl(var(--sand-50))",
          100: "hsl(var(--sand-100))",
          200: "hsl(var(--sand-200))",
          300: "hsl(var(--sand-300))",
          400: "hsl(var(--sand-400))",
          500: "hsl(var(--sand-500))",
          600: "hsl(var(--sand-600))",
          700: "hsl(var(--sand-700))",
          800: "hsl(var(--sand-800))",
          900: "hsl(var(--sand-900))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
