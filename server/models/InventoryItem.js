"use strict";
const mongoose = require("mongoose");

const InventoryItemSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    qty: { type: String, default: "" },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InventoryItem", InventoryItemSchema);
