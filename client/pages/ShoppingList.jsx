import React, { useEffect, useState } from "react";
import GlassCard from "../components/GlassCard";
import { api } from "../api/http";

export default function ShoppingList() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const data = await api.listShopping();
      setItems(data.items || []);
    } catch (e) {
      setErr(e.message || "Failed to load shopping list");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <GlassCard title="Shopping List" subtitle="Auto-filled by missing items from generated recipes.">
      {err ? <div className="error-banner">⚠️ {err}</div> : null}

      <div className="checklist">
        {items.map((it) => (
          <label key={it._id} className="checkrow">
            <input type="checkbox" checked={!!it.done} readOnly />
            <span>
              {it.name}
              {it.qty ? <span className="muted"> — {it.qty}</span> : null}
            </span>
          </label>
        ))}
        {items.length === 0 ? <div className="muted">No shopping items yet.</div> : null}
      </div>

      <button className="pill-btn pill-btn--ghost" type="button" onClick={load} style={{ marginTop: 12 }}>
        Refresh
      </button>
    </GlassCard>
  );
}
