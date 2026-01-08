// client/api/http.js
import axios from "axios";

const isProd = import.meta.env.PROD;

// IMPORTANT:
// Set VITE_API_URL in Vercel Production to: https://ai-app-8ale.onrender.com
const envUrl = import.meta.env.VITE_API_URL;

// Default fallback:
// - dev: local server
// - prod: Render (fallback in case env var missing)
const API_ORIGIN = isProd
  ? (envUrl || "https://ai-app-8ale.onrender.com")
  : (envUrl || "http://localhost:5050");

const origin = String(API_ORIGIN).replace(/\/+$/, "");

// This should be https://ai-app-8ale.onrender.com/api in prod
const baseURL = `${origin}/api`;

console.log("[http] PROD?", isProd, "| VITE_API_URL:", envUrl, "| baseURL:", baseURL);

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const method = (config.method || "GET").toUpperCase();
  const url = `${config.baseURL || ""}${config.url || ""}`;
  console.log(`[api] ${method} ${url}`, config.data ?? "");
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("[api] error:", err?.response?.status, err?.response?.data || err?.message);
    return Promise.reject(err);
  }
);

export default api;
