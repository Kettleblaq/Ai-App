import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

   // name optional (server only requires email/password)
    if (!email.includes("@")) return setErr("Enter a valid email");
    if (password.length < 6) return setErr("Password must be at least 6 characters");


    setBusy(true);
    try {
      await signup({ name: name.trim(), email, password });
      nav("/");
    } catch (e2) {
      setErr(e2.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassCard title="Create Account" subtitle="Signup uses secure sessions + cookies.">
      <form onSubmit={onSubmit} className="auth-form">
        <label className="field">
          <span className="field__label">Name</span>
          <input className="field__input" value={name} onChange={(e) => setName(e.target.value)} />
        </label>

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
          {busy ? "Creating..." : "Sign Up"}
        </button>

        <div className="muted" style={{ marginTop: 12 }}>
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </form>
    </GlassCard>
  );
}
