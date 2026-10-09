/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./{pages,components}/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        stage: "#252320",
        paper: "#F3F4F0",
        ink: "#232129",
        tape: "#FF3D8B",
        highlighter: "#F2E35C",
        spotify: "#1ED760",
      },
      fontFamily: {
        sans: ["var(--font-archivo)", "system-ui", "sans-serif"],
        marker: ["var(--font-marker)", "cursive"],
      },
    },
  },
  plugins: [],
};
