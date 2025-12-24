import React, { useState } from "react";
import GlassCard from "../components/GlassCard";
import { api } from "../api/http";

export default function Home() {
  const [ingredients, setIngredients] = useState("chicken, rice, broccoli");
  const [diet, setDiet] = useState("None");
  const [timeMinutes, setTimeMinutes] = useState(30);

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [missingItems, setMissingItems] = useState([]);
  const [shoppingAutoAdded, setShoppingAutoAdded] = useState(0);
  const [err, setErr] = useState("");

  async function onGenerate() {
    setErr("");
    setBusy(true);
    try {
      const data = await api.generateRecipe({ ingredients, diet, timeMinutes });
      setResult(data.recipe || null);
      setMissingItems(data.missingItems || []);
      setShoppingAutoAdded(Number(data.shoppingAutoAdded || 0));
    } catch (e) {
      setErr(e.message || "Failed to generate recipe");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassCard
      title="Featured Recipe"
      subtitle="Generates a recipe from your typed ingredients + in-stock inventory. Missing items auto-add to Shopping List."
    >
      <div className="form-grid">
        <label className="field">
          <span className="field__label">Ingredients (comma separated)</span>
          <input
            className="field__input"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="e.g. chicken, rice, broccoli"
          />
        </label>

        <label className="field">
          <span className="field__label">Diet</span>
          <select className="field__input" value={diet} onChange={(e) => setDiet(e.target.value)}>
            <option>None</option>
            <option>Vegetarian</option>
            <option>Vegan</option>
            <option>Keto</option>
            <option>Gluten-Free</option>
          </select>
        </label>

        <label className="field">
          <span className="field__label">Time (minutes)</span>
          <input
            className="field__input"
            type="number"
            min={5}
            max={240}
            value={timeMinutes}
            onChange={(e) => setTimeMinutes(Number(e.target.value))}
          />
        </label>

        <button className="big-btn" onClick={onGenerate} disabled={busy} type="button">
          {busy ? "Generating..." : "Generate"}
        </button>
      </div>

      {err ? <div className="error-banner">⚠️ {err}</div> : null}

      {result ? (
        <div className="result">
          <h2 className="result__title">{result.title}</h2>

          <div className="result__meta">
            <span className="meta-pill">Diet: {result.meta?.diet || "None"}</span>
            <span className="meta-pill">Time: {result.meta?.timeMinutes || 30} min</span>
            <span className="meta-pill">Cuisine: {result.meta?.cuisine || "Custom"}</span>
          </div>

          {missingItems?.length ? (
            <div className="info-banner" style={{ marginTop: 12 }}>
              🛒 Missing items added to Shopping List: <b>{shoppingAutoAdded}</b>
              <div className="muted" style={{ marginTop: 6 }}>
                Missing: {missingItems.join(", ")}
              </div>
            </div>
          ) : (
            <div className="success-banner" style={{ marginTop: 12 }}>
              ✅ Looks like you have everything on-hand (based on your inventory).
            </div>
          )}

          <div className="result__cols">
            <div className="result__col">
              <h3 className="result__h">Ingredients</h3>
              <ul className="clean-list">
                {(result.ingredients || []).map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>

            <div className="result__col">
              <h3 className="result__h">Steps</h3>
              <ol className="clean-list">
                {(result.steps || []).map((s, idx) => (
                  <li key={`${idx}-${s}`}>{s}</li>
                ))}
              </ol>
              {result.meta?.notes ? (
                <div className="muted" style={{ marginTop: 10 }}>
                  {result.meta.notes}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </GlassCard>
  );
}
