
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from '../assets/LuminaCV Logo Board.png';
import {
  UserRound,
  Upload,
  Layers,
  AlertTriangle,
  SlidersHorizontal,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { logout } from "../api/authApi";
import Modal from "./ui/Modal";

import "./Sidebar.css";

const navigationItems = [
  {
    label: "Profile",
    path: "/profile",
    icon: UserRound,
  },
  {
    label: "Import & Upload",
    path: "/upload",
    icon: Upload,
  },
  {
    label: "Issues",
    path: "/issues",
    icon: AlertTriangle,
  },
  {
  label: "Sources",
  icon: Layers,
  path: "/sources",
},

  

  {
    label: "Settings",
    path: "/settings",
    icon: SlidersHorizontal,
  },
];

export default function Sidebar({ account, issueCount }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const navigate = useNavigate();

  const closeSidebar = () => setIsOpen(false);
  const handleLogout = () => setShowLogoutConfirmation(true);
  const confirmLogout = async () => {
    setIsLoggingOut(true);
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
    <>
      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation"
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${isOpen ? "sidebar-open" : ""}`}
      >
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-icon">
  <img src={logo} alt="LuminaCV Logo" />
</div>

          <div className="brand-text">
            <h2>luminaCV</h2>
            <span>PROFILE SYNC</span>
          </div>
        </div>

        {/* Workspace Label */}
        <div className="workspace-label">
          WORKSPACE
        </div>

        {/* Navigation */}
        <nav className="sidebar-navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const count = item.path === "/issues" ? issueCount : item.count;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `sidebar-link ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <Icon
                  className="sidebar-link-icon"
                  size={17}
                  strokeWidth={1.8}
                />

                <span className="sidebar-link-label">
                  {item.label}
                </span>

                {count !== undefined && (
                  <span
                    className={`sidebar-count ${
                      item.path === "/issues" ? "issue-count" : ""
                    }`}
                  >
                    {count}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-account">
          <NavLink
            className="sidebar-user"
            to="/profile"
            onClick={closeSidebar}
            aria-label="View profile"
          >
            <div className="user-avatar">{account.initials}</div>
            <div className="user-info">
              <h3>{account.name}</h3>
              <p>{account.title}</p>
            </div>
          </NavLink>

          <button
            className="sidebar-logout"
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut size={15} strokeWidth={1.8} />
            <span>{isLoggingOut ? "Logging out…" : "Log out"}</span>
          </button>
        </div>
      </aside>

      {showLogoutConfirmation && (
        <Modal
          title="Log out?"
          onClose={() => {
            if (!isLoggingOut) setShowLogoutConfirmation(false);
          }}
        >
          <p className="sidebar-logout-modal-message">
            Are you sure you want to log out of your account?
          </p>
          <div className="sidebar-logout-modal-actions">
            <button
              className="sidebar-logout-cancel"
              type="button"
              onClick={() => setShowLogoutConfirmation(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </button>
            <button
              className="sidebar-logout-confirm"
              type="button"
              onClick={confirmLogout}
              disabled={isLoggingOut}
            >
              <LogOut size={15} strokeWidth={1.8} />
              {isLoggingOut ? "Logging out…" : "Log out"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
