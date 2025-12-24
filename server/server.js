"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
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
const NODE_ENV = String(process.env.NODE_ENV || "development");
const isProd = NODE_ENV === "production";

// --- Robust connect-mongo import (handles default export edge cases) ---
const MongoStore =
  (connectMongo && typeof connectMongo.create === "function" && connectMongo) ||
  (connectMongo && connectMongo.default && typeof connectMongo.default.create === "function" && connectMongo.default) ||
  null;

function isAllowedOrigin(origin) {
  // same-origin / server-side calls (no Origin header)
  if (!origin) return true;

  // allow exact configured origin (useful in dev)
  if (origin === CLIENT_ORIGIN) return true;

  // allow common local ports (both http and https)
  const localOk =
    /^http:\/\/localhost:(517[0-9]|418[0-9]|417[0-9]|52[0-9]{2})$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1:(517[0-9]|418[0-9]|417[0-9]|52[0-9]{2})$/.test(origin) ||
    /^https:\/\/localhost:(517[0-9]|418[0-9]|417[0-9]|52[0-9]{2})$/.test(origin) ||
    /^https:\/\/127\.0\.0\.1:(517[0-9]|418[0-9]|417[0-9]|52[0-9]{2})$/.test(origin);

  // In production, if you deploy as ONE service (Express serves React),
  // the browser requests to /api will be same-origin, and CORS won't be needed.
  // But keeping this check doesn't hurt.
  return localOk;
}

async function start() {
  const app = express();

  // Needed when secure cookies behind proxy in prod (Render/Heroku/etc.)
  app.set("trust proxy", 1);

  // --- CORS (mainly for local dev when client and server are different origins) ---
  app.use(
    cors({
      origin: (origin, cb) => {
        if (isAllowedOrigin(origin)) return cb(null, true);
        return cb(new Error(`CORS blocked origin: ${origin}`));
      },
      credentials: true,
    })
  );

  app.use(express.json());

  // Basic request log
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });

  // Mongo connect
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
        // For SAME-ORIGIN deployment (Express serves React), Lax is correct and reliable.
        sameSite: "lax",
        // In production (Render = https), secure must be true.
        secure: isProd,
      },
    })
  );

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/recipes", recipeRoutes);
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api/shopping", shoppingRoutes);

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  // --- Serve React build in production ---
  if (isProd) {
    const clientDistPath = path.join(__dirname, "..", "client", "dist");
    app.use(express.static(clientDistPath));

    // React Router fallback (so refresh on /login works)
    app.get("*", (req, res) => {
      res.sendFile(path.join(clientDistPath, "index.html"));
    });
  }

  // Centralized error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error("🔥 Unhandled error:", err);
    res.status(500).json({ ok: false, error: err?.message || "Server error" });
  });

  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ NODE_ENV=${NODE_ENV}`);
    console.log(`✅ CLIENT_ORIGIN=${CLIENT_ORIGIN}`);
    console.log(`✅ Session store: ${useStore ? "MongoStore" : "MemoryStore (dev)"}`);
  });
}

start().catch((e) => {
  console.error("Fatal startup error:", e);
  process.exit(1);
});
