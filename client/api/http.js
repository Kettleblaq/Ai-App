"use strict";

/**
 * Central API client for the React app.
 * IMPORTANT: This file must NOT contain JSX.
 *
 * Uses Vite proxy by default via "/api".
 * If you set VITE_API_BASE in client/.env, it will use that instead.
 */

const BASE = (import.meta?.env?.VITE_API_BASE || "/api").replace(/\/$/, "");

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data?.error || data?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // ---------- Auth ----------
  async me() {
    const data = await request("/auth/me", { method: "GET" });
    return data?.user || null;
  },

  async login(payload) {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
    return data?.user || null;
  },

  async signup(payload) {
    const data = await request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
    return data?.user || null;
  },

  async logout() {
    return request("/auth/logout", { method: "POST" });
  },

  // ---------- Inventory ----------
  listInventory() {
    return request("/inventory", { method: "GET" }); // { ok, items }
  },

  addInventory(name, qty) {
    return request("/inventory", {
      method: "POST",
      body: JSON.stringify({ name, qty }),
    });
  },

  toggleInventory(id, done) {
    return request(`/inventory/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ done }),
    });
  },

  // Alias so older UI code won't crash if it calls updateInventory(...)
  updateInventory(id, patch) {
    return request(`/inventory/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch || {}),
    });
  },

  deleteInventory(id) {
    return request(`/inventory/${id}`, { method: "DELETE" });
  },

  // ---------- Shopping List ----------
  listShopping() {
    return request("/shopping", { method: "GET" }); // { ok, items }
  },

  addShopping(name, qty) {
    return request("/shopping", {
      method: "POST",
      body: JSON.stringify({ name, qty }),
    });
  },

  updateShopping(id, patch) {
    return request(`/shopping/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch || {}),
    });
  },

  deleteShopping(id) {
    return request(`/shopping/${id}`, { method: "DELETE" });
  },

  // ---------- Recipes ----------
  listRecipes() {
    return request("/recipes", { method: "GET" }); // { ok, recipes }
  },

  deleteRecipe(id) {
    return request(`/recipes/${id}`, { method: "DELETE" });
  },

  generateRecipe(payload) {
    return request("/recipes/generate", {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
  },
};
