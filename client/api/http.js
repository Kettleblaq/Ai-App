import axios from "axios";

// IMPORTANT:
// - In production (Vercel), this should be SAME-ORIGIN "/api"
//   so the browser does NOT do CORS to Render directly.
// - In dev (localhost), also use "/api" and let Vite proxy (optional),
//   OR change VITE_API_BASE to "http://localhost:5050" if you prefer.
const baseURL = import.meta.env.VITE_API_BASE || "/api";

const api = axios.create({
  baseURL,
  withCredentials: true, // required for cookie-based sessions
  headers: {
    "Content-Type": "application/json",
  },
});

// Helpful debug (optional)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Keep this log short so it doesn't spam your console
    console.error("API error:", err?.response?.status, err?.config?.url);
    return Promise.reject(err);
  }
);

export default api;
