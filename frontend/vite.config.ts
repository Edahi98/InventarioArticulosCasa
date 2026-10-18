import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const BACKEND_URL = process.env.VITE_BACKEND_URL ?? "http://localhost:3000";
const BACKEND_ROUTES = ["/categories", "/articles", "/notes", "/auth", "/search", "/users", "/reports", "/scrape", "/match"];

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: Object.fromEntries(BACKEND_ROUTES.map((route) => [route, BACKEND_URL])),
  },
});
