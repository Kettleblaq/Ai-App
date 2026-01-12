// client/src/pages/Recipes.jsx
import React, { useEffect, useState } from "react";
import GlassCard from "../components/GlassCard";

const BASE = "https://ai-app-delta-lac.vercel.app/api";

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

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  async function load() {
    setErr("");
    setOkMsg("");
    setLoading(true);

    try {
      const data = await request("/recipes", { method: "GET" });
      setRecipes(Array.isArray(data?.recipes) ? data.recipes : []);
    } catch (e) {
      setErr(e?.message || "Failed to load recipes");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id) {
    if (!id) return;
    setErr("");
    setOkMsg("");
    setBusyId(id);

    try {
      await request(`/recipes/${id}`, { method: "DELETE" });
      setRecipes((prev) => prev.filter((r) => (r._id || r.id) !== id));
      setOkMsg("Recipe deleted.");
    } catch (e) {
      setErr(e?.message || "Failed to delete");
    } finally {
      setBusyId("");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <GlassCard
      title="Recipes"
      subtitle="Your saved recipes live here. Generate recipes on Home."
      right={
        <button className="pill-btn" onClick={load} disabled={loading || !!busyId} type="button">
          {loading ? "Loading..." : "Refresh"}
        </button>
      }
    >
      {err ? <div className="error-banner">⚠️ {err}</div> : null}
      {okMsg ? <div className="ok-banner">✅ {okMsg}</div> : null}

      {loading ? (
        <div className="muted" style={{ marginTop: 10 }}>
          Loading…
        </div>
      ) : recipes.length === 0 ? (
        <div className="muted" style={{ marginTop: 10 }}>
          No saved recipes yet. Generate one on Home.
        </div>
      ) : (
        <div className="recipe-grid" style={{ marginTop: 12 }}>
          {recipes.map((r) => {
            const id = r._id || r.id;
            const title = r.title || "Untitled Recipe";
            const diet = r.meta?.diet || "None";
            const time = r.meta?.timeMinutes ?? 30;
            const ingredients = Array.isArray(r.ingredients) ? r.ingredients.join(", ") : "";

            return (
              <article key={id || title} className="mini-card">
                <div className="mini-card__top">
                  <h3 className="mini-card__title">{title}</h3>

                  <button
                    className="icon-btn"
                    onClick={() => remove(id)}
                    type="button"
                    aria-label="Delete"
                    title="Delete recipe"
                    disabled={busyId === id}
                  >
                    {busyId === id ? "…" : "✕"}
                  </button>
                </div>

                <div className="mini-card__meta">
                  <span className="meta-pill">Diet: {diet}</span>
                  <span className="meta-pill">{time} min</span>
                </div>

                <div className="mini-card__body">
                  <div className="mini-card__h">Ingredients</div>
                  <div className="mini-card__text">{ingredients}</div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
