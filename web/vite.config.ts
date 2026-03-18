import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import { defineConfig } from "vite";

dotenv.config({ path: path.resolve(__dirname, ".env"), quiet: true });

const DEV_API = new URL(process.env.VITE_DEV_API || "http://localhost:8000/api");

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BUILD_BASE || "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: DEV_API.origin,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, DEV_API.pathname.replace(/\/$/, "")),
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
