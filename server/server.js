require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");

const app = express();

// Render is behind a proxy (secure cookies need this)
app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());

// --------------------
// CORS (mostly for local dev / non-proxied calls)
// If you use Vercel "/api" proxy, browser calls are SAME-ORIGIN and CORS won't matter.
// --------------------
const rawOrigins = process.env.CLIENT_ORIGIN || "";
const allowedOrigins = rawOrigins
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, cb) {
    // allow server-to-server / curl / Render health checks
    if (!origin) return cb(null, true);

    // allow explicit list
    if (allowedOrigins.includes(origin)) return cb(null, true);

    // allow vercel previews for your account
    if (/^https:\/\/ai-.*-dwilliams429s-projects\.vercel\.app$/.test(origin)) return cb(null, true);

    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// --------------------
// Health
// --------------------
app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    nodeEnv: process.env.NODE_ENV || null,
    hasMongo: Boolean(process.env.MONGO_URI),
    hasSessionSecret: Boolean(process.env.SESSION_SECRET),
    clientOrigin: process.env.CLIENT_ORIGIN || null,
  });
});

app.get("/", (req, res) => res.status(200).send("OK"));

// --------------------
// Start
// --------------------
async function start() {
  const MONGO_URI = process.env.MONGO_URI;
  const SESSION_SECRET = process.env.SESSION_SECRET;

  if (!MONGO_URI) {
    console.error("❌ MONGO_URI is missing. Set it in Render env vars (and .env for local).");
    process.exit(1);
  }
  if (!SESSION_SECRET) {
    console.error("❌ SESSION_SECRET is missing. Set it in Render env vars (and .env for local).");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("✅ Mongo connected");

  // Cookie behavior:
  // - Production (Render/Vercel): secure cookies required, sameSite none if truly cross-site
  // - If you use SAME-ORIGIN "/api" proxy on Vercel, sameSite=Lax is OK too.
  const isProd = process.env.NODE_ENV === "production";

  app.use(
    session({
      name: "sid",
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      proxy: true,
      store: MongoStore.create({
        mongoUrl: MONGO_URI,
        ttl: 60 * 60 * 24 * 7, // 7 days
      }),
      cookie: {
        httpOnly: true,
        // If you are using Vercel "/api" proxy, "lax" is enough.
        // If you are calling Render directly from the browser, you need "none".
        sameSite: isProd ? "lax" : "lax",
        secure: isProd, // true on Render/https, false on localhost http
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    })
  );

  // --------------------
  // ROUTES (attach your real ones)
  // --------------------
  // Example:
  // const authRoutes = require("./routes/auth");
  // app.use("/auth", authRoutes);

  const PORT = process.env.PORT || 10000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ NODE_ENV=${process.env.NODE_ENV}`);
    console.log(`✅ CLIENT_ORIGIN=${process.env.CLIENT_ORIGIN}`);
  });
}

start().catch((err) => {
  console.error("❌ Server failed to start:", err);
  process.exit(1);
});
