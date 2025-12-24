// client/api/http.js

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5050/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include", // ✅ REQUIRED for sessions/cookies
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }

  return res.json();
}

/* ---------- AUTH ---------- */

export const login = (data) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const signup = (data) =>
  request("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const logout = () =>
  request("/auth/logout", {
    method: "POST",
  });

export const me = () =>
  request("/auth/me");

/* ---------- OTHER APIs ---------- */

export const getRecipes = () =>
  request("/recipes");

export const getInventory = () =>
  request("/inventory");

export const getShoppingList = () =>
  request("/shopping");
