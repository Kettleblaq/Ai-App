"use strict";

const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/requireAuth");
const { generateBetterRecipe, computeMissingShoppingItems } = require("../services/aiRecipe");

const Recipe = require("../models/Recipe");
const InventoryItem = require("../models/InventoryItem");
const ShoppingItem = require("../models/ShoppingItem");

/* GET /api/recipes */
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const recipes = await Recipe.find({ userId }).sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, recipes });
  } catch (e) {
    console.error("List recipes error:", e);
    return res.status(500).json({ ok: false, error: "Failed to load recipes" });
  }
});

/**
 * POST /api/recipes/generate
 * Generates a recipe, saves it, then:
 * - compares vs inventory
 * - adds missing to shopping
 */
router.post("/generate", requireAuth, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const { ingredients, diet, timeMinutes } = req.body || {};

    const list = Array.isArray(ingredients)
      ? ingredients.map(String).map((s) => s.trim()).filter(Boolean)
      : String(ingredients || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    if (!list.length) {
      return res.status(400).json({ ok: false, error: "Ingredients are required." });
    }

    // Pantry = inventory items that are in stock (done=false)
    const inventoryItems = await InventoryItem.find({ userId }).lean();
    const pantry = inventoryItems
      .filter((x) => !x.done)
      .map((x) => x.name)
      .filter(Boolean);

    console.log("🍳 Generate called:", {
      userId,
      count: list.length,
      diet: diet || "None",
      timeMinutes: Number(timeMinutes) || 30,
      pantryCount: pantry.length,
      hasGeminiKey: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
      modelEnv: process.env.GEMINI_MODEL,
    });

    // IMPORTANT: generateBetterRecipe returns { recipe, usedAI, modelUsed }
    const { recipe, usedAI, modelUsed } = await generateBetterRecipe({
      ingredients: list,
      pantry,
      diet: diet || "None",
      timeMinutes: Number(timeMinutes) || 30,
    });

    // Save recipe
    const savedRecipe = await new Recipe({
      userId,
      title: recipe.title,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      meta: {
        ...(recipe.meta || {}),
        usedAI: !!usedAI,
        modelUsed: modelUsed || null,
      },
    }).save();

    // Parse ingredient lines into { name, qty }
    const parsedIngredients = (Array.isArray(savedRecipe.ingredients) ? savedRecipe.ingredients : [])
      .map(parseIngredientLine)
      .filter((x) => x && x.name);

    // Missing shopping items vs inventory
    const recipeNamesForCompare = parsedIngredients.map((x) => x.name);
    const missingNames = computeMissingShoppingItems(recipeNamesForCompare, inventoryItems);

    // Auto-add missing to shopping list
    let shoppingAutoAdded = 0;
    for (const name of missingNames) {
      const clean = String(name || "").trim();
      if (!clean) continue;

      const exists = await ShoppingItem.findOne({
        userId,
        name: new RegExp(`^${escapeRegex(clean)}$`, "i"),
        done: false,
      }).lean();

      if (!exists) {
        const found = parsedIngredients.find((x) => x.name.toLowerCase() === clean.toLowerCase());
        await ShoppingItem.create({
          userId,
          name: clean,
          qty: found?.qty || "",
          done: false,
        });
        shoppingAutoAdded++;
      }
    }

    return res.json({
      ok: true,
      recipe: savedRecipe,
      usedAI,
      modelUsed,
      shoppingAutoAdded,
      missingItems: missingNames,
    });
  } catch (e) {
    console.error("Generate error:", e);
    return res.status(500).json({ ok: false, error: e?.message || "Generate failed" });
  }
});

/* DELETE /api/recipes/:id */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const id = String(req.params.id);
    const deleted = await Recipe.findOneAndDelete({ _id: id, userId }).lean();
    if (!deleted) return res.status(404).json({ ok: false, error: "Not found" });
    return res.json({ ok: true });
  } catch (e) {
    console.error("Delete recipe error:", e);
    return res.status(500).json({ ok: false, error: "Failed to delete recipe" });
  }
});

/* ---------------- helpers ---------------- */

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Parse ingredient line into { name, qty }
 */
function parseIngredientLine(line) {
  let s = String(line || "").trim();
  if (!s) return null;

  s = s.replace(/\([^)]*\)/g, " ").trim();
  s = s.replace(/\boptional\b/gi, "").replace(/\s+/g, " ").trim();

  const m = s.match(/^(\d+(?:\.\d+)?(?:\s*\d\/\d)?|\d\/\d)\s*([a-zA-Z]+)?\s*(.*)$/);

  if (m) {
    const qtyNum = (m[1] || "").trim();
    const unit = (m[2] || "").trim();
    let rest = (m[3] || "").trim();

    rest = rest.replace(/^of\s+/i, "").trim();
    if (!rest) return { name: s, qty: "" };

    const qty = `${qtyNum}${unit ? " " + unit : ""}`.trim();

    const unitLooksLikeUnit =
      /^(tsp|tbsp|cup|cups|oz|lb|lbs|g|kg|ml|l|pinch|clove|cloves|slice|slices|can|cans|bunch|sprig|sprigs)$/i.test(
        unit
      );

    if (unit && !unitLooksLikeUnit) {
      return { name: s, qty: "" };
    }

    rest = rest.replace(/,\s*(juiced|minced|chopped|diced|sliced|grated).*$/i, "").trim();
    return { name: rest, qty };
  }

  return { name: s, qty: "" };
}

module.exports = router;
