/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        accent: 'var(--accent)',
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        text: 'var(--text)',
        success: 'var(--success)',
        warn: 'var(--warn)',
        error: 'var(--error)',
      },
    },
  },
  plugins: [],
}
