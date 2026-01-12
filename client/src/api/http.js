"use strict";

// Central client API wrapper (NO JSX IN THIS FILE)

const BASE =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) ||
  "https://ai-app-delta-lac.vercel.app/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include", // IMPORTANT for cookie sessions
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error || data?.message || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // -------- Auth --------
  async signup(payload) {
    const data = await request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
    return data?.user || null;
  },

  async login(payload) {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
    return data?.user || null;
  },

  async logout() {
    return request("/auth/logout", { method: "POST" });
  },

  async me() {
    const data = await request("/auth/me", { method: "GET" });
    return data?.user || null;
  },

  // -------- Inventory --------
  listInventory() {
    return request("/inventory", { method: "GET" });
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

  updateInventory(id, updates) {
    return request(`/inventory/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates || {}),
    });
  },

  deleteInventory(id) {
    return request(`/inventory/${id}`, { method: "DELETE" });
  },

  // -------- Shopping List --------
  listShopping() {
    return request("/shopping", { method: "GET" });
  },

  addShopping(name, qty) {
    return request("/shopping", {
      method: "POST",
      body: JSON.stringify({ name, qty }),
    });
  },

  updateShopping(id, updates) {
    return request(`/shopping/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates || {}),
    });
  },

  deleteShopping(id) {
    return request(`/shopping/${id}`, { method: "DELETE" });
  },

  // -------- Recipes --------
  listRecipes() {
    return request("/recipes", { method: "GET" });
  },

  deleteRecipe(id) {
    return request(`/recipes/${id}`, { method: "DELETE" });
  },

  /**
   * Generate a recipe from Home.jsx
   * Tries /recipes/generate first (most common),
   * falls back to /recipes if your server uses that.
   */
  async generateRecipe(payload) {
    const body = JSON.stringify(payload || {});

    try {
      return await request("/recipes/generate", { method: "POST", body });
    } catch (e) {
      // fallback if your backend route is POST /api/recipes
      if (e?.status === 404) {
        return request("/recipes", { method: "POST", body });
      }
      throw e;
    }
  },
};
