import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// If you use vite-plugin-pwa, you can re-enable it later.
// For now, this config keeps dev stable and avoids SSL/HMR issues.

export default defineConfig({
  plugins: [react()],

  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,

    // IMPORTANT: Do NOT force wss/https in dev unless you actually configured certs.
    // Leaving HMR default prevents ERR_SSL_PROTOCOL_ERROR / SSL certificate errors.

    proxy: {
      "/api": {
        target: "http://localhost:5050",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    sourcemap: true,
  },
});
