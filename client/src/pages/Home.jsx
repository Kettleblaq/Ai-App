// client/src/pages/Home.jsx
import React, { useMemo, useState } from "react";
import GlassCard from "../components/GlassCard";
import { api } from "../api/http";

export default function Home() {
  const [ingredients, setIngredients] = useState("chicken, rice, broccoli");
  const [diet, setDiet] = useState("None");
  const [timeMinutes, setTimeMinutes] = useState("30");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [recipe, setRecipe] = useState(null);

  const dietOptions = useMemo(
    () => ["None", "Vegetarian", "Vegan", "Gluten-Free", "Keto", "Paleo"],
    []
  );

  async function onGenerate(e) {
    e.preventDefault();
    setErr("");
    setOkMsg("");
    setRecipe(null);

    const ing = String(ingredients || "").trim();
    const t = Number(timeMinutes);

    if (!ing) return setErr("Please enter at least one ingredient.");
    if (!Number.isFinite(t) || t <= 0) return setErr("Time must be a positive number.");

    setBusy(true);
    try {
      const data = await api.generateRecipe({
        ingredients: ing,
        diet,
        timeMinutes: t,
      });

      const r = data?.recipe || data;
      setRecipe(r || null);
      setOkMsg("Recipe generated.");
    } catch (e2) {
      setErr(e2?.message || "Failed to generate recipe.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassCard
      title="Featured Recipe"
      subtitle="Generate a better recipe from your ingredients + your saved inventory. Missing items auto-add to Shopping List."
    >
      {err ? <div className="error-banner">⚠️ {err}</div> : null}
      {okMsg ? <div className="ok-banner">✅ {okMsg}</div> : null}

      <form onSubmit={onGenerate} className="form-grid" style={{ marginTop: 14 }}>
        <div className="field">
          <label>Ingredients (comma separated)</label>
          <input
            className="pill-input"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="e.g., chicken, rice, broccoli"
          />
        </div>

        <div className="form-row-2">
          <div className="field">
            <label>Diet</label>
            <select className="select-like" value={diet} onChange={(e) => setDiet(e.target.value)}>
              {dietOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Time (minutes)</label>
            <input
              className="pill-input"
              type="number"
              min={1}
              value={timeMinutes}
              onChange={(e) => setTimeMinutes(e.target.value)}
              inputMode="numeric"
              placeholder="30"
            />
          </div>
        </div>

        <button className="big-btn" type="submit" disabled={busy}>
          {busy ? "Generating..." : "Generate"}
        </button>
      </form>

      {recipe ? (
        <div style={{ marginTop: 18 }}>
          <h2 style={{ margin: "10px 0 6px 0" }}>{recipe.title || "Recipe"}</h2>

          <div className="muted" style={{ marginBottom: 10 }}>
            {recipe.meta?.diet ? `Diet: ${recipe.meta.diet}` : recipe.diet ? `Diet: ${recipe.diet}` : null}
            {(recipe.meta?.diet || recipe.diet) ? " • " : null}
            {recipe.meta?.timeMinutes
              ? `${recipe.meta.timeMinutes} min`
              : recipe.timeMinutes
              ? `${recipe.timeMinutes} min`
              : null}
          </div>

          {Array.isArray(recipe.ingredients) ? (
            <>
              <h3 style={{ margin: "14px 0 8px 0" }}>Ingredients</h3>
              <ul>
                {recipe.ingredients.map((x, idx) => (
                  <li key={idx}>{x}</li>
                ))}
              </ul>
            </>
          ) : null}

          {Array.isArray(recipe.steps) ? (
            <>
              <h3 style={{ margin: "14px 0 8px 0" }}>Steps</h3>
              <ol>
                {recipe.steps.map((x, idx) => (
                  <li key={idx}>{x}</li>
                ))}
              </ol>
            </>
          ) : null}
        </div>
      ) : null}
    </GlassCard>
  );
}
