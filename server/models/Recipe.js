"use strict";

const mongoose = require("mongoose");

const RecipeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    ingredients: { type: [String], default: [] },
    steps: { type: [String], default: [] },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

// Prevent OverwriteModelError + ensure consistent model instance
module.exports = mongoose.models.Recipe || mongoose.model("Recipe", RecipeSchema);
