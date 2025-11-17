/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        rv: {
          bg: "#FAF9FD",
          surface: "#FFFFFF",
          border: "#E4DEF5",
          primary: "#A47CF3",
          primaryStrong: "#7C3AED",
          accentSoft: "#F3E8FF",
          text: "#14121F",
          muted: "#6B6680",
          success: "#16A34A",
          warning: "#F97316",
          error: "#EF4444",
        },
      },
      borderRadius: {
        rvLg: "18px",
        rvXl: "24px",
      },
      boxShadow: {
        rvSoft: "0 18px 45px rgba(20, 18, 31, 0.08)",
      },
    },
  },
  plugins: [],
};
