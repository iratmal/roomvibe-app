/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        rv: {
          primary: "#0B1F2A",
          primaryHover: "#071520",
          accent: "#D8B46A",
          neutral: "#DDE1E7",
          bg: "#FFFFFF",
          surface: "#F9FAFB",
          text: "#1A1A1A",
          textMuted: "#6B7280",
          success: "#16A34A",
          warning: "#F97316",
          error: "#EF4444",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        rvSm: "8px",
        rvMd: "12px",
        rvLg: "16px",
      },
      boxShadow: {
        rvSoft: "0 10px 30px rgba(11, 31, 42, 0.08)",
        rvElevated: "0 14px 40px rgba(11, 31, 42, 0.15)",
      },
    },
  },
  plugins: [],
};
