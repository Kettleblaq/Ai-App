import axios from "axios";

// Default to Vercel rewrite proxy
const baseURL = import.meta.env.VITE_API_BASE || "/api";

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
});

export default api;
