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
const NODE_ENV = String(process.env.NODE_ENV || "development");
const isProd = NODE_ENV === "production";

// --- Robust connect-mongo import (handles default export edge cases) ---
const MongoStore =
  (connectMongo && typeof connectMongo.create === "function" && connectMongo) ||
  (connectMongo &&
    connectMongo.default &&
    typeof connectMongo.default.create === "function" &&
    connectMongo.default) ||
  null;

/**
 * ✅ Origin allowlist:
 * - In prod, allow only your deployed frontend origin (CLIENT_ORIGIN)
 * - In dev, allow common localhost ports (http + https)
 */
function isAllowedOrigin(origin) {
  // Some requests (curl, server-to-server, same-origin) may have no Origin header
  if (!origin) return true;

  // allow exact configured origin (your deployed frontend)
  if (origin === CLIENT_ORIGIN) return true;

  // allow local dev origins (both http and https)
  const localOk =
    /^http:\/\/localhost:(517[0-9]|418[0-9]|417[0-9]|52[0-9]{2})$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1:(517[0-9]|418[0-9]|417[0-9]|52[0-9]{2})$/.test(origin) ||
    /^https:\/\/localhost:(517[0-9]|418[0-9]|417[0-9]|52[0-9]{2})$/.test(origin) ||
    /^https:\/\/127\.0\.0\.1:(517[0-9]|418[0-9]|417[0-9]|52[0-9]{2})$/.test(origin);

  // In production we usually do NOT want random extra origins.
  // But allowing localOk doesn't hurt if NODE_ENV is correctly set to "production" on deploy.
  if (!isProd && localOk) return true;

  return localOk;
}

async function start() {
  const app = express();

  /**
   * ✅ IMPORTANT for production deployments behind a proxy (Render/Fly/NGINX/Vercel-like):
   * Allows secure cookies to work because Express can see the real protocol (https).
   */
  app.set("trust proxy", 1);

  // Body parsing
  app.use(express.json({ limit: "1mb" }));

  // Basic request log (helps debug)
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });

  /**
   * ✅ CORS must:
   * - echo the Origin (not "*") when credentials are used
   * - allow credentials
   */
  app.use(
    cors({
      origin: (origin, cb) => {
        if (isAllowedOrigin(origin)) return cb(null, true);
        return cb(new Error(`CORS blocked origin: ${origin}`));
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );


  // DB
  if (MONGODB_URI) {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Mongo connected");
  } else {
    console.warn("⚠️ Missing MONGODB_URI in server/.env");
  }

  // Sessions
  const useStore = Boolean(MONGODB_URI && MongoStore);

  /**
   * ✅ Cookie rules:
   * - dev: sameSite "lax", secure false
   * - prod (HTTPS): sameSite "none", secure true  (required for cross-site cookies)
   */
  const cookieOptions = {
    httpOnly: true,
    secure: isProd, // MUST be true on HTTPS deployments
    sameSite: isProd ? "none" : "lax",
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
  };

  app.use(
    session({
      name: "sid",
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      rolling: true, // keeps session alive while user is active (optional but nice)
      store: useStore
        ? MongoStore.create({
            mongoUrl: MONGODB_URI,
            collectionName: "sessions",
            ttl: 14 * 24 * 60 * 60, // 14 days
          })
        : undefined,
      cookie: cookieOptions,
    })
  );

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/recipes", recipeRoutes);
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api/shopping", shoppingRoutes);

  // Health
  app.get("/api/health", (_req, res) =>
    res.json({
      ok: true,
      env: NODE_ENV,
      clientOrigin: CLIENT_ORIGIN,
      mongo: Boolean(MONGODB_URI),
      sessionStore: useStore ? "MongoStore" : "MemoryStore",
    })
  );

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
