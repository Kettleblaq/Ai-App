// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Anything hitting /api on the Vite dev server will be forwarded to Express
      "/api": {
        target: "http://localhost:5050",
        changeOrigin: true,
        secure: false,
        // /api/auth/login -> http://localhost:5050/auth/login
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
