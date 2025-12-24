import React, { useEffect, useMemo, useState } from "react";
import GlassCard from "../components/GlassCard";
import { api } from "../api/http";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  async function load() {
    setErr("");
    setOkMsg("");
    setLoading(true);
    try {
      const data = await api.listInventory(); // { ok, items }
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setErr(e?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Backend uses "done" boolean — we map:
  // done=true  => In stock
  // done=false => Out of stock
  const counts = useMemo(() => {
    const inStock = items.filter((x) => !!x.done).length;
    const out = items.length - inStock;
    return { inStock, out };
  }, [items]);

  async function onAdd(e) {
    e.preventDefault();
    setErr("");
    setOkMsg("");

    const name = newName.trim();
    const qty = newQty.trim();

    if (!name) {
      setErr("Item name is required.");
      return;
    }

    setBusy(true);
    try {
      const data = await api.addInventory(name, qty); // { ok, item }
      const created = data?.item;

      if (created && (created._id || created.id)) {
        setItems((prev) => [created, ...prev]);
      } else {
        await load();
      }

      setNewName("");
      setNewQty("");
      setOkMsg("Added to inventory.");
    } catch (e2) {
      setErr(e2?.message || "Failed to add inventory item");
    } finally {
      setBusy(false);
    }
  }

  async function toggleInStock(it) {
    setErr("");
    setOkMsg("");

    const id = it._id || it.id;
    if (!id) return;

    const nextDone = !it.done;

    // optimistic UI
    setItems((prev) =>
      prev.map((x) => ((x._id || x.id) === id ? { ...x, done: nextDone } : x))
    );

    try {
      const data = await api.toggleInventory(id, nextDone);
      const updated = data?.item;
      if (updated && (updated._id || updated.id)) {
        setItems((prev) => prev.map((x) => ((x._id || x.id) === id ? updated : x)));
      }
    } catch (e) {
      // revert
      setItems((prev) => prev.map((x) => ((x._id || x.id) === id ? it : x)));
      setErr(e?.message || "Failed to update item");
    }
  }

  async function removeItem(it) {
    setErr("");
    setOkMsg("");

    const id = it._id || it.id;
    if (!id) return;

    const before = items;
    setItems((prev) => prev.filter((x) => (x._id || x.id) !== id));

    try {
      await api.deleteInventory(id);
      setOkMsg("Removed.");
    } catch (e) {
      setItems(before);
      setErr(e?.message || "Failed to delete item");
    }
  }

  return (
    <GlassCard
      title="Inventory"
      subtitle={`Track what you have on hand (real saved data). In stock: ${counts.inStock} • Out: ${counts.out}`}
      right={
        <button className="pill-btn" onClick={load} disabled={loading || busy} type="button">
          {loading ? "Loading..." : "Refresh"}
        </button>
      }
    >
      {err ? <div className="error-banner">⚠️ {err}</div> : null}
      {okMsg ? <div className="ok-banner">✅ {okMsg}</div> : null}

      <form className="stack-row" onSubmit={onAdd}>
        <input
          className="pill-input"
          placeholder="Item (e.g., Chicken breast)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          className="pill-input"
          placeholder="Qty (optional) e.g., 2 lbs"
          value={newQty}
          onChange={(e) => setNewQty(e.target.value)}
        />
        <button className="pill-btn" type="submit" disabled={busy}>
          {busy ? "Adding..." : "Add"}
        </button>
      </form>

      <div style={{ marginTop: 14 }}>
        {loading ? (
          <div className="muted">Loading your inventory…</div>
        ) : items.length === 0 ? (
          <div className="muted">No items yet. Add one above.</div>
        ) : (
          <ul className="list" style={{ marginTop: 10 }}>
            {items.map((it) => {
              const id = it._id || it.id || it.name;
              const inStock = !!it.done;

              return (
                <li key={id} className="list__row">
                  <label className="list__left">
                    <input
                      type="checkbox"
                      checked={inStock}
                      onChange={() => toggleInStock(it)}
                      style={{ transform: "scale(1.1)" }}
                    />
                    <span className={inStock ? "list__text" : "list__text list__text--done"}>
                      {it.name}
                      {it.qty ? <span className="muted"> — {it.qty}</span> : null}
                    </span>
                  </label>

                  <button className="icon-btn" title="Remove" onClick={() => removeItem(it)} type="button">
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </GlassCard>
  );
}
