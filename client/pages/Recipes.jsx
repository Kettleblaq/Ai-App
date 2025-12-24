import React, { useEffect, useState } from "react";
import GlassCard from "../components/GlassCard";
import { api } from "../api/http";

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const data = await api.listRecipes();
      setRecipes(data.recipes || []);
    } catch (e) {
      setErr(e.message || "Failed to load recipes");
    }
  }

  async function remove(id) {
    setErr("");
    try {
      await api.deleteRecipe(id);
      setRecipes((prev) => prev.filter((r) => r._id !== id));
    } catch (e) {
      setErr(e.message || "Failed to delete");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <GlassCard title="Recipes" subtitle="Next step: fetch real recipes from the server and display cards here.">
      {err ? <div className="error-banner">⚠️ {err}</div> : null}

      <div className="recipe-grid">
        {recipes.length === 0 ? (
          <div className="muted">No saved recipes yet. Generate one on Home.</div>
        ) : (
          recipes.map((r) => (
            <article key={r._id} className="mini-card">
              <div className="mini-card__top">
                <h3 className="mini-card__title">{r.title}</h3>
                <button className="icon-x" onClick={() => remove(r._id)} type="button" aria-label="Delete">
                  ×
                </button>
              </div>
              <div className="mini-card__meta">
                <span className="meta-pill">Diet: {r.meta?.diet || "None"}</span>
                <span className="meta-pill">{r.meta?.timeMinutes || 30} min</span>
              </div>
              <div className="mini-card__body">
                <div className="mini-card__h">Ingredients</div>
                <div className="mini-card__text">{(r.ingredients || []).join(", ")}</div>
              </div>
            </article>
          ))
        )}
      </div>
    </GlassCard>
  );
}
