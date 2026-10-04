import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { fileURLToPath, URL } from "node:url";

// In dev, /api/* is proxied to the backend so the browser sees one origin
// (cookies just work, no CORS needed). In production, serve the built files
// and route /api/* to the backend at your reverse proxy / host.
const BACKEND = process.env.VITE_BACKEND_URL ?? "http://localhost:3001";

export default defineConfig({
  server: { port: 5173, proxy: { "/api": { target: BACKEND, changeOrigin: true } } },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react(), tailwindcss()],
});
