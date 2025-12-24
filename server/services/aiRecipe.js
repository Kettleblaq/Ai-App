"use strict";

let GoogleGenerativeAI = null;
try {
  ({ GoogleGenerativeAI } = require("@google/generative-ai"));
} catch (_) {
  GoogleGenerativeAI = null;
}

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

function uniq(arr) {
  return Array.from(new Set(arr));
}

function cleanToken(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^[,.-]+|[,.-]+$/g, "");
}

function normalizeName(s) {
  return cleanToken(s)
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(optional|to taste|as needed)\b/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseMaybeList(ingredients) {
  const list = Array.isArray(ingredients)
    ? ingredients.map(String)
    : String(ingredients || "")
        .split(",")
        .map((x) => x.trim());

  return uniq(
    list
      .map(cleanToken)
      .map((x) => x.replace(/\s*\([^)]*\)\s*/g, " ").trim())
      .filter(Boolean)
  );
}

function coreNameFromLine(line) {
  let s = cleanToken(line);
  if (!s) return "";

  s = s.replace(/\([^)]*\)/g, " ").trim();
  s = s.replace(
    /^(\d+(\.\d+)?|\d\/\d|\d+\s+\d\/\d)\s*([a-zA-Z]+)?\s+/,
    ""
  ).trim();

  s = s.replace(/^of\s+/i, "").trim();
  s = s.replace(/,\s*(chopped|diced|minced|sliced|grated|juiced).*$/i, "").trim();

  return normalizeName(s);
}

function toTitleCase(s) {
  return String(s || "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function hasAny(normList, tokens) {
  const set = new Set(normList);
  return tokens.some((t) => set.has(t));
}

function hasAll(normList, tokens) {
  const set = new Set(normList);
  return tokens.every((t) => set.has(t));
}

function hasEither(normList, a, b) {
  const set = new Set(normList);
  return set.has(a) || set.has(b);
}

function isBreadLike(n) {
  return /\b(bread|bun|roll|bagel|tortilla|wrap|pita)\b/.test(n);
}

function isRiceLike(n) {
  return /\b(rice|quinoa|couscous)\b/.test(n);
}

function isPastaLike(n) {
  return /\b(pasta|noodles)\b/.test(n);
}

function isProtein(n) {
  return /\b(chicken|turkey|beef|pork|salmon|tuna|shrimp|tofu|tempeh|beans|lentils|egg|eggs)\b/.test(n);
}

function isVeg(n) {
  return /\b(broccoli|spinach|kale|lettuce|pepper|peppers|onion|garlic|tomato|carrot|zucchini|cucumber|mushroom)\b/.test(n);
}

function pickOneByRegex(normList, re) {
  return normList.find((x) => re.test(x)) || "";
}

function prettyFromNorm(n) {
  // turn "black pepper" => "Black Pepper"
  return toTitleCase(String(n || "").replace(/\s+/g, " ").trim());
}

function buildSmarterTitle(rawIngredients) {
  const ingRaw = parseMaybeList(rawIngredients);
  const ingNorm = ingRaw.map(normalizeName).filter(Boolean);

  // --- Signature combos (highest priority) ---
  // PB&J
  if (
    hasAll(ingNorm, ["peanut butter", "jelly"]) ||
    hasAll(ingNorm, ["peanut butter", "jam"]) ||
    hasAll(ingNorm, ["peanut butter", "preserves"])
  ) {
    if (ingNorm.some(isBreadLike)) return "PB&J Sandwich";
    return "PB&J";
  }

  // Grilled cheese
  if (hasAny(ingNorm, ["cheese"]) && ingNorm.some(isBreadLike) && hasEither(ingNorm, "butter", "olive oil")) {
    return "Grilled Cheese";
  }

  // Omelet / scrambled eggs
  if (hasAny(ingNorm, ["egg", "eggs"])) {
    const hasVeg = ingNorm.some(isVeg);
    const hasCheese = hasAny(ingNorm, ["cheese"]);
    if (hasVeg && hasCheese) return "Veggie Cheese Omelet";
    if (hasVeg) return "Veggie Omelet";
    if (hasCheese) return "Cheese Omelet";
    return "Scrambled Eggs";
  }

  // Pasta bowl
  if (ingNorm.some(isPastaLike)) {
    const protein = pickOneByRegex(ingNorm, /\b(chicken|shrimp|tuna|salmon|tofu|beans|lentils)\b/);
    const veg = pickOneByRegex(ingNorm, /\b(broccoli|spinach|tomato|mushroom|pepper|onion|garlic|zucchini)\b/);
    if (protein && veg) return `${prettyFromNorm(protein)} ${prettyFromNorm(veg)} Pasta`;
    if (protein) return `${prettyFromNorm(protein)} Pasta`;
    if (veg) return `${prettyFromNorm(veg)} Pasta`;
    return "Simple Pasta";
  }

  // Rice bowl
  if (ingNorm.some(isRiceLike)) {
    const protein = pickOneByRegex(ingNorm, /\b(chicken|beef|pork|salmon|tuna|shrimp|tofu|beans|lentils)\b/);
    const veg = pickOneByRegex(ingNorm, /\b(broccoli|spinach|pepper|onion|tomato|carrot|zucchini|mushroom)\b/);
    if (protein && veg) return `${prettyFromNorm(protein)} ${prettyFromNorm(veg)} Rice Bowl`;
    if (protein) return `${prettyFromNorm(protein)} Rice Bowl`;
    if (veg) return `${prettyFromNorm(veg)} Rice Bowl`;
    return "Rice Bowl";
  }

  // Sandwich / wrap
  if (ingNorm.some(isBreadLike)) {
    const protein = pickOneByRegex(ingNorm, /\b(chicken|turkey|beef|pork|tuna|salmon|tofu|beans|egg|eggs)\b/);
    const veg = pickOneByRegex(ingNorm, /\b(lettuce|tomato|onion|cucumber|pepper|spinach)\b/);
    const cheese = hasAny(ingNorm, ["cheese"]);
    if (protein && (veg || cheese)) {
      const parts = [prettyFromNorm(protein)];
      if (cheese) parts.push("Cheese");
      if (veg) parts.push(prettyFromNorm(veg));
      return `${parts.join(" ")} Sandwich`;
    }
    if (protein) return `${prettyFromNorm(protein)} Sandwich`;
    return "Simple Sandwich";
  }

  // --- General heuristic ---
  const protein = pickOneByRegex(ingNorm, /\b(chicken|turkey|beef|pork|salmon|tuna|shrimp|tofu|tempeh|beans|lentils|egg|eggs)\b/);
  const veg = pickOneByRegex(ingNorm, /\b(broccoli|spinach|kale|pepper|peppers|onion|garlic|tomato|carrot|zucchini|cucumber|mushroom)\b/);
  const carb = pickOneByRegex(ingNorm, /\b(rice|quinoa|oats|potato|potatoes)\b/);

  const parts = [];
  if (protein) parts.push(prettyFromNorm(protein));
  if (veg) parts.push(prettyFromNorm(veg));
  if (carb) parts.push(prettyFromNorm(carb));

  if (parts.length >= 2) return `${parts.join(" ")} Bowl`;
  if (parts.length === 1) return `${parts[0]} Bowl`;

  // Fallback: first 2-3 ingredients, but CLEAN and no commentary
  const fallback = ingRaw
    .slice(0, 3)
    .map((x) => cleanToken(x))
    .filter(Boolean)
    .map((x) => toTitleCase(x));

  return fallback.length ? fallback.join(" ") : "Quick Recipe";
}

function buildFallbackRecipe({ ingredients, pantry = [], diet = "None", timeMinutes = 30 }) {
  const ing = parseMaybeList(ingredients);
  const pan = parseMaybeList(pantry);

  const title = buildSmarterTitle(ing);

  const staples = ["salt", "black pepper", "olive oil"];
  const helpfulFromPantry = pan.filter((x) =>
    ["salt", "pepper", "black pepper", "olive oil", "butter", "soy sauce", "vinegar", "lemon", "lime"].includes(
      normalizeName(x)
    )
  );

  const finalIngredients = uniq([
    ...ing,
    ...helpfulFromPantry,
    ...staples.filter((s) => !ing.some((x) => normalizeName(x) === normalizeName(s))),
  ]);

  const norm = ing.map(normalizeName);
  const hasRice = norm.some(isRiceLike);
  const hasPasta = norm.some(isPastaLike);
  const hasBread = norm.some(isBreadLike);
  const protein = norm.find(isProtein) || "";
  const veg = norm.find(isVeg) || "";

  const steps = [];
  steps.push("Prep ingredients and heat a pan over medium heat.");

  if (hasRice) steps.push("Cook rice (or warm leftover rice).");
  if (hasPasta) steps.push("Boil pasta/noodles until al dente, then drain.");
  if (hasBread) steps.push("Toast bread/wrap lightly (optional).");

  if (protein) steps.push(`Cook the ${protein} with oil, salt, and pepper until done.`);
  if (veg) steps.push(`Add the ${veg} and cook until tender.`);
  steps.push("Combine everything, adjust seasoning, and serve.");

  return {
    title,
    ingredients: finalIngredients.map((x) => `• ${x}`),
    steps: steps.map((s, i) => `${i + 1}. ${s}`),
    meta: {
      diet,
      timeMinutes: Number(timeMinutes) || 30,
    },
  };
}

async function tryGeminiRecipe({ ingredients, pantry = [], diet = "None", timeMinutes = 30 }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey || !GoogleGenerativeAI) return null;

  const ing = parseMaybeList(ingredients);
  const pan = parseMaybeList(pantry);

  const prompt = `
Return STRICT JSON ONLY.

{
  "title": string,
  "ingredients": string[],
  "steps": string[],
  "meta": { "diet": string, "timeMinutes": number }
}

Rules:
- Use the provided ingredients (do not invent a different dish).
- You may add basic staples (salt, pepper, oil, water) and pantry items listed.
- Title should NOT include commentary like "(Simple Recipe)" or jokes.

Ingredients: ${JSON.stringify(ing)}
Pantry: ${JSON.stringify(pan)}
Diet: ${diet}
Time: ${Number(timeMinutes) || 30}
`.trim();

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });
  const result = await model.generateContent(prompt);

  const text = result?.response?.text?.() || "";
  const jsonText = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(jsonText);

  return {
    title: parsed.title,
    ingredients: parsed.ingredients,
    steps: parsed.steps,
    meta: parsed.meta,
  };
}

async function generateBetterRecipe({ ingredients, pantry = [], diet = "None", timeMinutes = 30 }) {
  try {
    const aiRecipe = await tryGeminiRecipe({ ingredients, pantry, diet, timeMinutes });
    if (aiRecipe) {
      return { recipe: aiRecipe, usedAI: true, modelUsed: DEFAULT_MODEL };
    }
  } catch (e) {
    console.warn("⚠️ Gemini failed, using fallback:", e?.message || e);
  }

  const recipe = buildFallbackRecipe({ ingredients, pantry, diet, timeMinutes });
  return { recipe, usedAI: false, modelUsed: null };
}

function computeMissingShoppingItems(recipeNames, inventoryItems) {
  const inStock = new Set(
    (inventoryItems || [])
      .filter((x) => x && x.name && x.done === false)
      .map((x) => normalizeName(x.name))
  );

  const missing = [];
  for (const r of recipeNames || []) {
    const core = coreNameFromLine(r);
    if (!core) continue;
    if (["salt", "pepper", "black pepper", "water"].includes(core)) continue;
    if (inStock.has(core)) continue;

    const softHit = Array.from(inStock).some((x) => x.includes(core) || core.includes(x));
    if (softHit) continue;

    missing.push(cleanToken(r));
  }

  return uniq(missing).filter(Boolean);
}

module.exports = {
  generateBetterRecipe,
  computeMissingShoppingItems,
};
