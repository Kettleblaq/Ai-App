import React, { useEffect, useMemo, useState } from "react";
import GlassCard from "../components/GlassCard";
import { api } from "../api/http";

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [shopping, setShopping] = useState([]);
  const [invName, setInvName] = useState("");
  const [invQty, setInvQty] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopQty, setShopQty] = useState("");
  const [err, setErr] = useState("");

  const rightSlot = useMemo(
    () => (
      <button className="pill-btn pill-btn--ghost" type="button" onClick={() => load()}>
        Refresh
      </button>
    ),
    []
  );

  async function load() {
    setErr("");
    try {
      const [inv, shop] = await Promise.all([api.listInventory(), api.listShopping()]);
      setInventory(inv.items || []);
      setShopping(shop.items || []);
    } catch (e) {
      setErr(e.message || "Failed to load");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addInventory() {
    if (!invName.trim()) return setErr("Inventory item name is required");
    setErr("");
    try {
      const data = await api.addInventory(invName.trim(), invQty.trim());
      setInventory((prev) => [data.item, ...prev]);
      setInvName("");
      setInvQty("");
    } catch (e) {
      setErr(e.message || "Failed to add inventory");
    }
  }

  async function toggleInventory(item) {
    setErr("");
    try {
      const data = await api.toggleInventory(item._id, !item.done);
      setInventory((prev) => prev.map((x) => (x._id === item._id ? data.item : x)));
    } catch (e) {
      setErr(e.message || "Failed to update inventory");
    }
  }

  async function addShopping() {
    if (!shopName.trim()) return setErr("Shopping item name is required");
    setErr("");
    try {
      const data = await api.addShopping(shopName.trim(), shopQty.trim());
      setShopping((prev) => [data.item, ...prev]);
      setShopName("");
      setShopQty("");
    } catch (e) {
      setErr(e.message || "Failed to add shopping item");
    }
  }

  async function toggleShopping(item) {
    setErr("");
    try {
      const data = await api.updateShopping(item._id, { done: !item.done });
      setShopping((prev) => prev.map((x) => (x._id === item._id ? data.item : x)));
    } catch (e) {
      setErr(e.message || "Failed to update shopping");
    }
  }

  async function removeShopping(id) {
    setErr("");
    try {
      await api.deleteShopping(id);
      setShopping((prev) => prev.filter((x) => x._id !== id));
    } catch (e) {
      setErr(e.message || "Failed to delete shopping item");
    }
  }

  return (
    <GlassCard title="Inventory" subtitle="Track what you have in stock (unchecked = in stock). Missing recipe items auto-add to Shopping." rightSlot={rightSlot}>
      {err ? <div className="error-banner">⚠️ {err}</div> : null}

      <div className="two-col">
        <section className="panel">
          <h2 className="panel__title">Inventory (In Stock)</h2>
          <div className="checklist">
            {inventory.map((it) => (
              <label key={it._id} className="checkrow">
                {/* done=true means OUT/used up */}
                <input type="checkbox" checked={!!it.done} onChange={() => toggleInventory(it)} />
                <span>
                  {it.name}
                  {it.qty ? <span className="muted"> — {it.qty}</span> : null}
                </span>
              </label>
            ))}
            {inventory.length === 0 ? <div className="muted">No inventory yet.</div> : null}
          </div>

          <div className="inline-add" style={{ gap: 8 }}>
            <input
              className="field__input"
              value={invName}
              onChange={(e) => setInvName(e.target.value)}
              placeholder="Item (e.g., chicken breast)"
            />
            <input
              className="field__input"
              value={invQty}
              onChange={(e) => setInvQty(e.target.value)}
              placeholder="Qty (optional) e.g., 2 lbs"
              style={{ maxWidth: 220 }}
            />
            <button className="pill-btn" onClick={addInventory} type="button">
              Add
            </button>
          </div>

          <div className="muted" style={{ marginTop: 10 }}>
            Tip: Check an item when you’re out of it. Recipes treat unchecked items as “available.”
          </div>
        </section>

        <section className="panel">
          <h2 className="panel__title">Shopping List</h2>

          <div className="shop-grid">
            <div className="checklist">
              {shopping.map((it) => (
                <label key={it._id} className="checkrow">
                  <input type="checkbox" checked={!!it.done} onChange={() => toggleShopping(it)} />
                  <span>
                    {it.name}
                    {it.qty ? <span className="muted"> — {it.qty}</span> : null}
                  </span>
                </label>
              ))}
              {shopping.length === 0 ? <div className="muted">No shopping items yet.</div> : null}
            </div>

            <div className="shop-actions">
              {shopping.map((it) => (
                <button
                  key={`${it._id}-x`}
                  className="icon-x"
                  onClick={() => removeShopping(it._id)}
                  type="button"
                  aria-label={`Delete ${it.name}`}
                >
                  ×
                </button>
              ))}
            </div>
          </div>

          <div className="inline-add" style={{ gap: 8 }}>
            <input
              className="field__input"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Add item (e.g., milk)"
            />
            <input
              className="field__input"
              value={shopQty}
              onChange={(e) => setShopQty(e.target.value)}
              placeholder="Qty (optional) e.g., 2"
              style={{ maxWidth: 220 }}
            />
            <button className="pill-btn" onClick={addShopping} type="button">
              Add
            </button>
          </div>

          <button
            className="big-btn big-btn--ghost"
            type="button"
            onClick={() =>
              navigator.share
                ? navigator.share({
                    title: "Shopping List",
                    text: shopping.map((s) => `- ${s.name}${s.qty ? ` (${s.qty})` : ""}`).join("\n"),
                  })
                : alert("Share not supported in this browser")
            }
          >
            Share / Export
          </button>
        </section>
      </div>
    </GlassCard>
  );
}
