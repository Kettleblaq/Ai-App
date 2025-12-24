"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const mongoose = require("mongoose");
const connectMongo = require("connect-mongo");

const authRoutes = require("./routes/auth");
const recipeRoutes = require("./routes/recipes");
const inventoryRoutes = require("./routes/inventory");
const shoppingRoutes = require("./routes/shopping");

const PORT = Number(process.env.PORT || 5050);
const CLIENT_ORIGIN = String(process.env.CLIENT_ORIGIN || "http://localhost:5173");
const MONGODB_URI = String(process.env.MONGODB_URI || "");
const SESSION_SECRET = String(process.env.SESSION_SECRET || "dev_secret");
const isProd = process.env.NODE_ENV === "production";

// Robust connect-mongo import
const MongoStore =
  (connectMongo && typeof connectMongo.create === "function" && connectMongo) ||
  (connectMongo && connectMongo.default && typeof connectMongo.default.create === "function" && connectMongo.default) ||
  null;

function isAllowedOrigin(origin) {
  if (!origin) return true;

  if (origin === CLIENT_ORIGIN) return true;

  // allow common local ports (both http and https)
  const localOk =
    /^http:\/\/localhost:(517[0-9]|418[0-9]|417[0-9]|52[0-9]{2})$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1:(517[0-9]|418[0-9]|417[0-9]|52[0-9]{2})$/.test(origin) ||
    /^https:\/\/localhost:(517[0-9]|418[0-9]|417[0-9]|52[0-9]{2})$/.test(origin) ||
    /^https:\/\/127\.0\.0\.1:(517[0-9]|418[0-9]|417[0-9]|52[0-9]{2})$/.test(origin);

  return localOk;
}

async function start() {
  const app = express();

  // needed when secure cookies behind proxy in prod (Render)
  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: (origin, cb) => {
        if (isAllowedOrigin(origin)) return cb(null, true);
        return cb(new Error(`CORS blocked origin: ${origin}`));
      },
      credentials: true,
    })
  );

  // IMPORTANT: preflight handling WITHOUT "*" string wildcard
  // Using regex avoids path-to-regexp wildcard issues.
  app.options(/.*/, cors({ origin: CLIENT_ORIGIN, credentials: true }));

  app.use(express.json());

  // Request log
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });

  if (MONGODB_URI) {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Mongo connected");
  } else {
    console.warn("⚠️ Missing MONGODB_URI in server/.env (or Render env vars)");
  }

  // Sessions
  const useStore = Boolean(MONGODB_URI && MongoStore);

  app.use(
    session({
      name: "sid",
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: useStore
        ? MongoStore.create({
            mongoUrl: MONGODB_URI,
            collectionName: "sessions",
            ttl: 14 * 24 * 60 * 60, // 14 days
          })
        : undefined,
      cookie: {
        httpOnly: true,
        sameSite: isProd ? "none" : "lax",
        secure: isProd, // must be true on Render (HTTPS)
      },
    })
  );

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/recipes", recipeRoutes);
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api/shopping", shoppingRoutes);

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  // 404 for anything else (NO catch-all "*" route)
  app.use((_req, res) => res.status(404).json({ ok: false, error: "Not found" }));

  // Centralized error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error("🔥 Unhandled error:", err);
    res.status(500).json({ ok: false, error: err?.message || "Server error" });
  });

  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ NODE_ENV=${process.env.NODE_ENV || "undefined"}`);
    console.log(`✅ CLIENT_ORIGIN=${CLIENT_ORIGIN}`);
    console.log(`✅ Session store: ${useStore ? "MongoStore" : "MemoryStore (dev)"}`);
  });
}

start().catch((e) => {
  console.error("Fatal startup error:", e);
  process.exit(1);
});
