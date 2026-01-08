// client/src/api/http.js
import axios from "axios";

const API_ORIGIN = import.meta.env.PROD
  ? "https://ai-app-8ale.onrender.com"
  : "http://localhost:5050";

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

console.log("[http] baseURL =", api.defaults.baseURL);

export default api;
