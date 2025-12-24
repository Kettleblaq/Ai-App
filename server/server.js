"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");

const authRoutes = require("./routes/auth");
const recipeRoutes = require("./routes/recipes");
const inventoryRoutes = require("./routes/inventory");
const shoppingRoutes = require("./routes/shopping");

const PORT = process.env.PORT || 10000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
const MONGODB_URI = process.env.MONGODB_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;

async function start() {
  const app = express();

  app.set("trust proxy", 1);

  // ✅ CORS FIX (THIS IS CRITICAL)
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (origin === CLIENT_ORIGIN) return cb(null, true);
        return cb(new Error(`CORS blocked: ${origin}`));
      },
      credentials: true,
    })
  );

  app.use(express.json());

  // Mongo
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Mongo connected");

  // Sessions
  app.use(
    session({
      name: "sid",
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: MONGODB_URI,
        collectionName: "sessions",
      }),
      cookie: {
        httpOnly: true,
        secure: true,          // Render = HTTPS
        sameSite: "none",      // REQUIRED for cross-site cookies
      },
    })
  );

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/recipes", recipeRoutes);
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api/shopping", shoppingRoutes);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`CLIENT_ORIGIN=${CLIENT_ORIGIN}`);
  });
}

start().catch((err) => {
  console.error("🔥 Fatal error:", err);
  process.exit(1);
});
