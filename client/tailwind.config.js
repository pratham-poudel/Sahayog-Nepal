/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
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
      },      keyframes: {
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
        "float-balloon-1": {
          "0%, 100%": { transform: "translateY(0px) translateX(0px)" },
          "50%": { transform: "translateY(-20px) translateX(10px)" },
        },
        "float-balloon-2": {
          "0%, 100%": { transform: "translateY(0px) translateX(0px)" },
          "50%": { transform: "translateY(-15px) translateX(-8px)" },
        },
        "float-balloon-3": {
          "0%, 100%": { transform: "translateY(0px) translateX(0px)" },
          "50%": { transform: "translateY(-10px) translateX(5px)" },
        },
        "float-balloon-4": {
          "0%, 100%": { transform: "translateY(0px) translateX(0px)" },
          "50%": { transform: "translateY(-12px) translateX(-3px)" },
        },
        "float-balloon-5": {
          "0%, 100%": { transform: "translateY(0px) translateX(0px)" },
          "50%": { transform: "translateY(-8px) translateX(6px)" },
        },
        "gentle-glow": {
          "0%, 100%": { opacity: "0.05" },
          "50%": { opacity: "0.1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float-balloon-1": "float-balloon-1 8s ease-in-out infinite",
        "float-balloon-2": "float-balloon-2 10s ease-in-out infinite 2s",
        "float-balloon-3": "float-balloon-3 6s ease-in-out infinite 1s",
        "float-balloon-4": "float-balloon-4 12s ease-in-out infinite 3s",
        "float-balloon-5": "float-balloon-5 9s ease-in-out infinite 4s",
        "gentle-glow": "gentle-glow 15s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
