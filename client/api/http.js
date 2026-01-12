// client/api/http.js
import axios from "axios";

const isProd = import.meta.env.PROD;

// Set this in Vercel Production:
// VITE_API_URL = https://ai-app-bcc0.onrender.com/
const envUrl = import.meta.env.VITE_API_URL;

const API_ORIGIN = isProd
  ? (envUrl || "https://ai-app-bcc0.onrender.com/")
  : (envUrl || "https://ai-app-bcc0.onrender.com/");

const origin = String(API_ORIGIN).replace(/\/+$/, "");
const baseURL = `${origin}/api`;

console.log("[http] baseURL =", baseURL);

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export default api;
