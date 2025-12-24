"use strict";

const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/requireAuth");
const InventoryItem = require("../models/InventoryItem");

// GET /api/inventory
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const items = await InventoryItem.find({ userId }).sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, items });
  } catch (e) {
    console.error("Inventory GET error:", e);
    return res.status(500).json({ ok: false, error: "Failed to load inventory" });
  }
});

// POST /api/inventory
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const { name, qty } = req.body || {};
    if (!name) return res.status(400).json({ ok: false, error: "Name required" });

    const item = await InventoryItem.create({
      userId,
      name: String(name).trim(),
      qty: String(qty || "").trim(),
      done: false,
    });

    return res.status(201).json({ ok: true, item });
  } catch (e) {
    console.error("Inventory POST error:", e);
    return res.status(500).json({ ok: false, error: "Failed to add item" });
  }
});

// PATCH /api/inventory/:id
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const id = String(req.params.id);
    const patch = req.body || {};

    const updated = await InventoryItem.findOneAndUpdate(
      { _id: id, userId },
      { $set: patch },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ ok: false, error: "Not found" });
    return res.json({ ok: true, item: updated });
  } catch (e) {
    console.error("Inventory PATCH error:", e);
    return res.status(500).json({ ok: false, error: "Failed to update item" });
  }
});

// DELETE /api/inventory/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const id = String(req.params.id);

    const deleted = await InventoryItem.findOneAndDelete({ _id: id, userId }).lean();
    if (!deleted) return res.status(404).json({ ok: false, error: "Not found" });

    return res.json({ ok: true });
  } catch (e) {
    console.error("Inventory DELETE error:", e);
    return res.status(500).json({ ok: false, error: "Failed to delete item" });
  }
});

module.exports = router;
