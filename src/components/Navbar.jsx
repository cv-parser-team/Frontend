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
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!menuOpen) return undefined;

    const closeMenu = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const confirmLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    let state;
    try {
      await logout();
    } catch (error) {
      console.error("Server logout failed; local credentials were cleared.", error);
      state = { notice: "logout-error" };
    }
    setShowLogoutConfirmation(false);
    setMenuOpen(false);
    navigate("/login", { replace: true, state });
  };

  return (
    <>
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

       

        {/* Account */}

        <div className="account-menu-wrap" ref={menuRef}>
          <div className="account-button">
            <Link className="account-profile-link" to="/profile" aria-label="View profile">
              <div className="account-avatar">{account.initials}</div>
              <div className="account-info">
                <strong>{account.name}</strong>
                <span>{account.title}</span>
              </div>
            </Link>
            <button
              type="button"
              className={`account-menu-toggle${menuOpen ? " open" : ""}`}
              aria-label="Open account menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <ChevronDown size={14} />
            </button>
          </div>

          {menuOpen && (
            <div className="account-dropdown" role="menu">
              <button
                type="button"
                role="menuitem"
                className="account-logout"
                onClick={() => {
                  setMenuOpen(false);
                  setShowLogoutConfirmation(true);
                }}
              >
                <LogOut size={15}/>
                Log out
              </button>
            </div>
          )}
        </div>

      </div>

      </header>
      {showLogoutConfirmation && (
        <Modal
          title="Log out?"
          onClose={() => {
            if (!isLoggingOut) setShowLogoutConfirmation(false);
          }}
        >
          <p className="navbar-logout-message">
            Are you sure you want to log out of your account?
          </p>
          <div className="navbar-logout-actions">
            <button
              type="button"
              className="navbar-logout-cancel"
              disabled={isLoggingOut}
              onClick={() => setShowLogoutConfirmation(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="navbar-logout-confirm"
              disabled={isLoggingOut}
              onClick={confirmLogout}
            >
              <LogOut size={15}/>
              {isLoggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}