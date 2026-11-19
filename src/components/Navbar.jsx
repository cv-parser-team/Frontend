import { useEffect, useRef, useState } from "react";
import "./Navbar.css";
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../api/authApi";
import Modal from "./ui/Modal";

export default function Navbar({ account }) {
  const [search, setSearch] = useState("");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const accountMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!accountMenuOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setAccountMenuOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    if (!logoutConfirmOpen || loggingOut) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setLogoutConfirmOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [logoutConfirmOpen, loggingOut]);

  const requestLogout = () => {
    setAccountMenuOpen(false);
    setLogoutConfirmOpen(true);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    let state;
    try {
      await logout();
    } catch (error) {
      console.error("Server logout failed; local credentials were cleared.", error);
      state = { notice: "logout-error" };
    }

    navigate("/login", { replace: true, state });
  };

  return (
    <header className="navbar">
 

      <div className="navbar-actions">

        {/* Search */}

        <div className="global-search">
          <Search size={15} />

          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <span>⌘ K</span>
        </div>

        {/* Notifications */}

        <button
          className="notification-button"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span>3</span>
        </button>

        {/* Account */}

        <div className="account-menu" ref={accountMenuRef}>
          <Link className="account-button" to="/profile" aria-label="View profile">
            <div className="account-avatar">{account.initials}</div>
            <div className="account-info">
              <strong>{account.name}</strong>
              <span>{account.title}</span>
            </div>
          </Link>
          <button
            type="button"
            className="account-menu-toggle"
            aria-label="Account options"
            aria-haspopup="menu"
            aria-expanded={accountMenuOpen}
            disabled={loggingOut}
            onClick={() => setAccountMenuOpen((open) => !open)}
          >
            <ChevronDown size={18} />
          </button>
          {accountMenuOpen && (
            <div className="account-dropdown" role="menu">
              <button
                type="button"
                className="account-dropdown-item"
                role="menuitem"
                onClick={requestLogout}
              >
                <LogOut size={15} />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {logoutConfirmOpen && (
        <Modal
          title="Log out?"
          onClose={() => {
            if (!loggingOut) setLogoutConfirmOpen(false);
          }}
        >
          <p>Are you sure you want to log out?</p>
          <div className="logout-confirm-actions">
            <button
              type="button"
              className="logout-confirm-cancel"
              disabled={loggingOut}
              onClick={() => setLogoutConfirmOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="logout-confirm-submit"
              disabled={loggingOut}
              onClick={handleLogout}
            >
              {loggingOut ? "Logging out…" : "Log out"}
            </button>
          </div>
        </Modal>
      )}

    </header>
  );
}