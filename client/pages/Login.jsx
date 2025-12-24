import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!email.includes("@")) return setErr("Enter a valid email");
    if (!password) return setErr("Password is required");

    setBusy(true);
    try {
      await login({ email, password });
      nav("/");
    } catch (e2) {
      setErr(e2.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassCard title="Login" subtitle="Sign in to access your recipes, inventory, and shopping list.">
      <form onSubmit={onSubmit} className="auth-form">
        <label className="field">
          <span className="field__label">Email</span>
          <input className="field__input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label className="field">
          <span className="field__label">Password</span>
          <input
            className="field__input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {err ? <div className="error-banner">⚠️ {err}</div> : null}

        <button className="big-btn" disabled={busy} type="submit">
          {busy ? "Signing in..." : "Login"}
        </button>

        <div className="muted" style={{ marginTop: 12 }}>
          No account? <Link to="/signup">Create one</Link>
        </div>
      </form>
    </GlassCard>
  );
}
