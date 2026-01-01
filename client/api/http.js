// client/api/http.js
import axios from "axios";

// Always call "/api" from the client.
// - DEV: Vite proxy forwards /api/* -> http://localhost:5050/*
// - PROD: Vercel rewrites forward /api/* -> Render
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export default api;
