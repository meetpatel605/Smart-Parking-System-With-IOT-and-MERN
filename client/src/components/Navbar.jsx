import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const links = user
    ? [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/parking", label: "Live Parking" },
        { to: "/history", label: "History" },
        { to: "/profile", label: "Profile" },
        ...(user.userType === "admin" ? [{ to: "/admin", label: "Admin" }] : []),
      ]
    : [
        { to: "/", label: "Home" },
        { to: "/about", label: "About" },
        { to: "/contact", label: "Contact" },
      ];

  return (
    <nav className="bg-base-card border-b border-base-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary">
          🚗 Smart Parking
        </Link>

        <button className="md:hidden text-slate-300" onClick={() => setOpen(!open)}>
          ☰
        </button>

        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-slate-300 hover:text-primary transition-colors text-sm">
              {l.label}
            </Link>
          ))}
          {user ? (
            <button onClick={handleLogout} className="btn-danger text-sm">
              Logout
            </button>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="btn-secondary text-sm">Login</Link>
              <Link to="/register" className="btn-primary text-sm">Register</Link>
            </div>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className="text-sm text-muted hover:text-primary transition-colors"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
          >
            {theme === "light" ? "☾ Dark" : "☀ Light"}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden px-4 pb-4 flex flex-col gap-3">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-slate-300">
              {l.label}
            </Link>
          ))}
          {user ? (
            <button onClick={handleLogout} className="btn-danger text-sm w-fit">Logout</button>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary text-sm">Login</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="btn-primary text-sm">Register</Link>
            </div>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className="text-left text-sm text-muted hover:text-primary transition-colors"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
          >
            {theme === "light" ? "☾ Dark theme" : "☀ Light theme"}
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
