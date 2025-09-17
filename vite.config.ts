import { fileURLToPath, URL } from "node:url";
import { defineConfig, type UserConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import svgLoader from "vite-svg-loader";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), svgLoader(), tailwindcss()],
  resolve: {
    alias: { "@": "/src" },
  },
});
