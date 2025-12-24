import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/http";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.me();
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const value = useMemo(
    () => ({
      user,
      booting,
      async signup(payload) {
        const data = await api.signup(payload);
        setUser(data.user);
      },
      async login(payload) {
        const data = await api.login(payload);
        setUser(data.user);
      },
      async logout() {
        await api.logout();
        setUser(null);
      }
    }),
    [user, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
