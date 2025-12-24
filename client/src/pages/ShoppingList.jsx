// client/src/pages/ShoppingList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import { api } from "../api/http";

export default function ShoppingList() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [newName, setNewName] = useState("");
  const [qty, setQty] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  async function load() {
    setErr("");
    setOkMsg("");
    setLoading(true);

    try {
      const data = await api.listShopping(); // expects { ok, items }
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      if (e?.status === 401) {
        navigate("/login");
        return;
      }
      setErr(e?.message || "Failed to load shopping list");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shareText = useMemo(() => {
    const lines = items.map((it) => {
      const q = it.qty ? ` (${it.qty})` : "";
      return `${it.done ? "✅" : "⬜"} ${it.name}${q}`;
    });
    return lines.length ? lines.join("\n") : "Shopping List is empty.";
  }, [items]);

  async function onAdd(e) {
    e.preventDefault();
    setErr("");
    setOkMsg("");

    const name = newName.trim();
    const q = qty.trim();

    if (!name) {
      setErr("Item name is required.");
      return;
    }

    setBusy(true);
    try {
      const data = await api.addShopping(name, q); // expects { ok, item }
      const created = data?.item;

      if (created && (created._id || created.id)) {
        setItems((prev) => [created, ...prev]);
      } else {
        await load();
      }

      setNewName("");
      setQty("");
      setOkMsg("Added to your Shopping List.");
    } catch (e2) {
      if (e2?.status === 401) {
        navigate("/login");
        return;
      }
      setErr(e2?.message || "Failed to add item");
    } finally {
      setBusy(false);
    }
  }

  async function toggleDone(it) {
    setErr("");
    setOkMsg("");

    const id = it._id || it.id;
    if (!id) return;

    // optimistic UI update
    setItems((prev) => prev.map((x) => ((x._id || x.id) === id ? { ...x, done: !x.done } : x)));

    try {
      const data = await api.updateShopping(id, { done: !it.done });
      const updated = data?.item;

      if (updated && (updated._id || updated.id)) {
        setItems((prev) => prev.map((x) => ((x._id || x.id) === id ? updated : x)));
      }
    } catch (e) {
      if (e?.status === 401) {
        navigate("/login");
        return;
      }
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
      await api.deleteShopping(id);
      setOkMsg("Removed.");
    } catch (e) {
      if (e?.status === 401) {
        navigate("/login");
        return;
      }
      setItems(before);
      setErr(e?.message || "Failed to delete item");
    }
  }

  async function onShare() {
    setErr("");
    setOkMsg("");

    try {
      await navigator.clipboard.writeText(shareText);
      setOkMsg("Copied to clipboard. Paste into Notes/Text/Email to share.");
    } catch {
      window.prompt("Copy your shopping list:", shareText);
    }
  }

  return (
    <GlassCard title="Shopping List" subtitle="Add items, check them off, remove them, and share/export.">
      {err ? <div className="error-banner">⚠️ {err}</div> : null}
      {okMsg ? <div className="ok-banner">✅ {okMsg}</div> : null}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Items</h2>
        <button className="pill-btn" onClick={load} disabled={loading || busy} type="button">
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div style={{ marginTop: 14 }}>
        {loading ? (
          <div className="muted">Loading your Shopping List…</div>
        ) : items.length === 0 ? (
          <div className="muted">No items yet. Add one below.</div>
        ) : (
          <ul className="list" style={{ marginTop: 10 }}>
            {items.map((it) => {
              const id = it._id || it.id || `${it.name}-${it.qty || ""}`;
              return (
                <li key={id} className="list__row">
                  <label className="list__left">
                    <input
                      type="checkbox"
                      checked={!!it.done}
                      onChange={() => toggleDone(it)}
                      style={{ transform: "scale(1.1)" }}
                    />
                    <span className={it.done ? "list__text list__text--done" : "list__text"}>
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

      <form onSubmit={onAdd} style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          className="pill-input"
          placeholder="Add item (e.g., Milk)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ flex: "1 1 260px" }}
        />
        <input
          className="pill-input"
          placeholder="Qty (optional) e.g., 2"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          style={{ flex: "0 1 180px" }}
        />
        <button className="pill-btn" type="submit" disabled={busy}>
          {busy ? "Adding..." : "Add"}
        </button>
      </form>

      <button className="big-btn" style={{ marginTop: 14 }} onClick={onShare} type="button">
        Share / Export
      </button>
    </GlassCard>
  );
}
