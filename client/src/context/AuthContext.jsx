import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/http";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  async function refreshMe() {
    setAuthError("");
    try {
      const me = await api.me();
      setUser(me);
      return me;
    } catch (e) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // IMPORTANT: accept an object {email, password}
  async function login({ email, password }) {
    setAuthError("");
    try {
      const u = await api.login({ email, password });
      setUser(u);
      return u;
    } catch (e) {
      setUser(null);
      setAuthError(e?.message || "Login failed");
      throw e;
    }
  }

  // IMPORTANT: accept an object {email, password} (and ignore extra fields safely)
  async function signup({ email, password }) {
    setAuthError("");
    try {
      const u = await api.signup({ email, password });
      setUser(u);
      return u;
    } catch (e) {
      setUser(null);
      setAuthError(e?.message || "Signup failed");
      throw e;
    }
  }

  async function logout() {
    setAuthError("");
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      login,
      signup,
      logout,
      refreshMe,
    }),
    [user, loading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be used inside <AuthProvider>");
  return ctx;
}
