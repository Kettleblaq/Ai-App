// client/src/App.jsx
import React, { useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import TopNav from "./components/TopNav";
import Home from "./pages/Home";
import Recipes from "./pages/Recipes";
import Inventory from "./pages/Inventory";
import ShoppingList from "./pages/ShoppingList";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import { useAuth } from "./context/AuthContext";

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState("");

  const activeTabLabel = useMemo(() => {
    if (!user) return "Welcome — please login to use saved features.";
    return "";
  }, [user]);

  return (
    <>
      <TopNav
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearchSubmit={() => navigate("/recipes")}
        activeTabLabel={activeTabLabel}
      />

      <Routes>
        <Route
          path="/"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />

        <Route
          path="/recipes"
          element={
            <RequireAuth>
              <Recipes />
            </RequireAuth>
          }
        />

        <Route
          path="/inventory"
          element={
            <RequireAuth>
              <Inventory />
            </RequireAuth>
          }
        />

        <Route
          path="/shopping-list"
          element={
            <RequireAuth>
              <ShoppingList />
            </RequireAuth>
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
