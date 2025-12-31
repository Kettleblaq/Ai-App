import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/http";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    try {
      const res = await api.get("/auth/me"); // NOTE: becomes /api/auth/me in browser
      setUser(res.data?.user ?? res.data ?? null);
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    // expected backend: POST /auth/login
    const res = await api.post("/auth/login", { email, password });
    await refreshMe();
    return res.data;
  }

  async function signup(name, email, password) {
    // expected backend: POST /auth/signup
    const res = await api.post("/auth/signup", { name, email, password });
    await refreshMe();
    return res.data;
  }

  async function logout() {
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
      refreshMe,
      login,
      signup,
      logout,
      setUser,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
