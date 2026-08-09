import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/categories": process.env.VITE_BACKEND_URL ?? "http://localhost:3000",
      "/articles":   process.env.VITE_BACKEND_URL ?? "http://localhost:3000",
      "/notes":      process.env.VITE_BACKEND_URL ?? "http://localhost:3000",
      "/auth":       process.env.VITE_BACKEND_URL ?? "http://localhost:3000",
      "/search":     process.env.VITE_BACKEND_URL ?? "http://localhost:3000",
    },
  },
});
