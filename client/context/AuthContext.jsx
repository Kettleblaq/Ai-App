// client/context/AuthContext.jsx (only the request paths matter)
import { createContext, useEffect, useState } from "react";
import api from "../api/http";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    try {
      const res = await api.get("/auth/me"); // <-- /api + /auth/me via baseURL
      setUser(res.data.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    await refreshMe();
    return res.data;
  }

  async function signup(name, email, password) {
    const res = await api.post("/auth/signup", { name, email, password });
    await refreshMe();
    return res.data;
  }

  async function logout() {
    await api.post("/auth/logout");
    setUser(null);
  }

  useEffect(() => {
    refreshMe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}
