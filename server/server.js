// server/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const inventoryRoutes = require("./routes/inventory");
const recipesRoutes = require("./routes/recipes");
const shoppingRoutes = require("./routes/shopping");

const app = express();

// Render sits behind a proxy -> required for secure cookies
app.set("trust proxy", 1);

// Parsers
app.use(express.json());
app.use(cookieParser());

// --------------------
// ENV helpers
// --------------------
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;

const rawOrigins = process.env.CLIENT_ORIGIN || process.env.CLIENT_ORIGINS || "";
const allowedOrigins = rawOrigins
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const isProd = process.env.NODE_ENV === "production";

// --------------------
// CORS
// --------------------
const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);

    if (allowedOrigins.includes(origin)) return cb(null, true);

    // allow Vercel preview deployments for your account
    if (/^https:\/\/ai-.*-dwilliams429s-projects\.vercel\.app$/.test(origin)) {
      return cb(null, true);
    }

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
    hasMongo: Boolean(MONGO_URI),
    hasSessionSecret: Boolean(SESSION_SECRET),
    clientOrigins: allowedOrigins,
  });
});

// --------------------
// Boot
// --------------------
async function start() {
  if (!MONGO_URI) {
    console.error("❌ Missing MONGO URI. Set MONGO_URI or MONGODB_URI.");
    process.exit(1);
  }
  if (!SESSION_SECRET) {
    console.error("❌ Missing SESSION_SECRET.");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("✅ Mongo connected");

  // Sessions MUST be registered before routes that use req.session
  app.use(
    session({
      name: "sid",
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      proxy: true,
      store: MongoStore.create({
        mongoUrl: MONGO_URI,
        ttl: 60 * 60 * 24 * 7,
      }),
      cookie: {
        httpOnly: true,

        // ✅ prod: Vercel->Render is cross-site https, so None+Secure
        // ✅ dev: localhost is http, so Lax + not secure
        sameSite: isProd ? "none" : "lax",
        secure: isProd,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    })
  );

  // ROUTES
  app.use("/auth", authRoutes);
  app.use("/inventory", inventoryRoutes);
  app.use("/recipes", recipesRoutes);
  app.use("/shopping", shoppingRoutes);

  app.get("/", (req, res) => res.status(200).send("OK"));

  // error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  });

  const PORT = process.env.PORT || 5050;
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Allowed origins: ${allowedOrigins.join(", ") || "(none set)"}`);
  });
}

start().catch((err) => {
  console.error("❌ Failed to start:", err);
  process.exit(1);
});
