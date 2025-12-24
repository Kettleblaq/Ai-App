// server/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email: String(email).toLowerCase(), passwordHash });

    // create session
    req.session.userId = user._id.toString();
    req.session.email = user.email;

    return res.status(201).json({ ok: true, user: { id: user._id, email: user.email } });
  } catch (e) {
    console.error("signup error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    req.session.userId = user._id.toString();
    req.session.email = user.email;

    return res.json({ ok: true, user: { id: user._id, email: user.email } });
  } catch (e) {
    console.error("login error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("sid");
    return res.json({ ok: true });
  });
});

// GET /api/auth/me  (auth proof)
router.get("/me", requireAuth, async (req, res) => {
  return res.json({ ok: true, user: { id: req.session.userId, email: req.session.email } });
});

module.exports = router;
