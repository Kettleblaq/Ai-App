import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function TopNav({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  activeTabLabel,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/login");
    }
  }

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div
          className="brand"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/");
          }}
        >
          <div className="brand__icon" aria-hidden="true">
            🔎
          </div>
          <div className="brand__text">
            <div className="brand__name">AI Recipe</div>
            <div className="brand__tag">simple • modern • auto-generated</div>
          </div>
        </div>

        <form
          className="searchbar"
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit?.();
          }}
        >
          <input
            value={searchValue || ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="searchbar__input"
            placeholder="Search recipes..."
            aria-label="Search recipes"
          />
          <button className="pill-btn" type="submit">
            Search
          </button>
        </form>

        <nav className="navpills" aria-label="Primary">
          <NavLink className={({ isActive }) => `pill-link ${isActive ? "is-active" : ""}`} to="/">
            Home
          </NavLink>

          <NavLink className={({ isActive }) => `pill-link ${isActive ? "is-active" : ""}`} to="/recipes">
            Recipes
          </NavLink>

          <NavLink className={({ isActive }) => `pill-link ${isActive ? "is-active" : ""}`} to="/inventory">
            Inventory
          </NavLink>

          <NavLink
            className={({ isActive }) => `pill-link ${isActive ? "is-active" : ""}`}
            to="/shopping-list"
          >
            Shopping List
          </NavLink>
        </nav>

        <div className="auth-mini">
          {user ? (
            <>
              <span className="auth-mini__user" title={user.email}>
                {user.name || user.email}
              </span>
              <button className="pill-btn pill-btn--ghost" onClick={handleLogout} type="button">
                Logout
              </button>
            </>
          ) : (
            <button className="pill-btn pill-btn--ghost" onClick={() => navigate("/login")} type="button">
              Login
            </button>
          )}
        </div>
      </div>

      {activeTabLabel ? <div className="topbar__hint">{activeTabLabel}</div> : null}
    </header>
  );
}
