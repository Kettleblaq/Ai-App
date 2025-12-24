"use strict";

const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/requireAuth");
const ShoppingItem = require("../models/ShoppingItem");

// GET /api/shopping
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const items = await ShoppingItem.find({ userId }).sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, items });
  } catch (e) {
    console.error("Shopping GET error:", e);
    return res.status(500).json({ ok: false, error: "Failed to load shopping list" });
  }
});

// POST /api/shopping
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const { name, qty } = req.body || {};
    if (!name) return res.status(400).json({ ok: false, error: "Name required" });

    const item = await ShoppingItem.create({
      userId,
      name: String(name).trim(),
      qty: String(qty || "").trim(),
      done: false, // done=true means purchased/checked off
    });

    return res.status(201).json({ ok: true, item });
  } catch (e) {
    console.error("Shopping POST error:", e);
    return res.status(500).json({ ok: false, error: "Failed to add item" });
  }
});

// PATCH /api/shopping/:id
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const id = String(req.params.id);
    const patch = req.body || {};

    // Compatibility: client might send { checked: true }
    if (Object.prototype.hasOwnProperty.call(patch, "checked")) {
      patch.done = !!patch.checked;
      delete patch.checked;
    }

    const updated = await ShoppingItem.findOneAndUpdate(
      { _id: id, userId },
      { $set: patch },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ ok: false, error: "Not found" });
    return res.json({ ok: true, item: updated });
  } catch (e) {
    console.error("Shopping PATCH error:", e);
    return res.status(500).json({ ok: false, error: "Failed to update item" });
  }
});

// DELETE /api/shopping/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const id = String(req.params.id);

    const deleted = await ShoppingItem.findOneAndDelete({ _id: id, userId }).lean();
    if (!deleted) return res.status(404).json({ ok: false, error: "Not found" });

    return res.json({ ok: true });
  } catch (e) {
    console.error("Shopping DELETE error:", e);
    return res.status(500).json({ ok: false, error: "Failed to delete item" });
  }
});

module.exports = router;
