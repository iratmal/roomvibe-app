/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        rv: {
          primary: "#283593",
          primaryHover: "#1e2770",
          accent: "#D8B46A",
          neutral: "#DDE1E7",
          bg: "#FFFFFF",
          surface: "#F9FAFB",
          text: "#111827",
          textMuted: "#6B7280",
          success: "#16A34A",
          warning: "#F97316",
          error: "#EF4444",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      borderRadius: {
        rvSm: "8px",
        rvMd: "12px",
        rvLg: "16px",
      },
      boxShadow: {
        rvSoft: "0 10px 30px rgba(40, 53, 147, 0.08)",
        rvElevated: "0 14px 40px rgba(40, 53, 147, 0.15)",
      },
    },
  },
  plugins: [],
};
