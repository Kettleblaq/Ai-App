// client/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/http"; // <-- uses your axios instance w/ baseURL "/api" + withCredentials

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  async function refreshMe() {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data?.user || null);
      setAuthError("");
      return res.data;
    } catch (err) {
      setUser(null);
      // not logged in is normal, don't treat as fatal
      return null;
    } finally {
      setLoading(false);
    }
  }

  // ✅ FIX: send JSON body correctly
  async function signup(payload) {
    setAuthError("");
    const email = payload?.email ?? "";
    const password = payload?.password ?? "";
    const name = payload?.name ?? "";

    try {
      const res = await api.post("/auth/signup", {
        email,
        password,
        name, // server can ignore if not used
      });

      // session cookie gets set by server; now verify
      await refreshMe();
      return res.data;
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Signup failed";
      setAuthError(msg);
      throw new Error(msg);
    }
  }

  async function login(email, password) {
    setAuthError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      await refreshMe();
      return res.data;
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Login failed";
      setAuthError(msg);
      throw new Error(msg);
    }
  }

  async function logout() {
    setAuthError("");
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
    }
  }

  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      refreshMe,
      signup,
      login,
      logout,
      setUser,
    }),
    [user, loading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
