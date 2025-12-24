import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Root route (what you asked about)
app.get("/", (req, res) => res.send("API running ✅ use /api/health"));

// ✅ Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "ai-recipe-server", time: new Date().toISOString() });
});

// ✅ Generate recipe (wire client Generate button here)
app.post("/api/recipes", async (req, res) => {
  try {
    const { ingredients = [], diet = "None", time = 30 } = req.body || {};

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: "ingredients must be a non-empty array" });
    }

    // If you later plug Gemini/OpenAI in here, keep the response shape the same.
    const title = `${diet !== "None" ? `${diet} ` : ""}${ingredients[0]} Bowl`;

    const recipe = {
      title,
      ingredients: [
        ...ingredients,
        "salt",
        "pepper",
        "olive oil",
      ],
      steps: [
        `Prep ingredients (${time} min total target).`,
        "Heat pan, add oil, cook main protein/veg until done.",
        "Combine with remaining ingredients, season to taste.",
        "Serve warm.",
      ],
      meta: { diet, time },
    };

    res.json(recipe);
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
