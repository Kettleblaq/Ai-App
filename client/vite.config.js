// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Anything hitting /api on the Vite dev server will be forwarded to Express
      "/api": {
        target: "https://ai-app-bcc0.onrender.com/",
        changeOrigin: true,
        secure: false,
        // /api/auth/login -> http://localhost:5050/auth/login
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
