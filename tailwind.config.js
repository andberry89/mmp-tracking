/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx,html}", "./src/styles/**/*.css"],
  theme: {
    extend: {
      fontFamily: {
        asap: ["Asap", "sans-serif"],
        monda: ["Monda", "sans-serif"],
      },
    },
  },
  plugins: [],
};
