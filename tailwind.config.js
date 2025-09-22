export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx,html}", "./src/styles/**/*.css"],
  safelist: ["font-asap", "font-monda"],
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
