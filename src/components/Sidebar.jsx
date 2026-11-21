
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from '../assets/LuminaCV Logo Board.png';
import {
  Network,
  UserRound,
  Upload,
  Layers,
  CircleCheck,
  Clock,
  SlidersHorizontal,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { logout } from "../api/authApi";

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

export default function Sidebar({ account }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const closeSidebar = () => setIsOpen(false);
  const handleLogout = async () => {
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

                {item.count !== undefined && (
                  <span
                    className={`sidebar-count ${
                      item.label === "Review Center"
                        ? "review-count"
                        : ""
                    }`}
                  >
                    {item.count}
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

          <button className="sidebar-logout" type="button" onClick={handleLogout}>
            <LogOut size={15} strokeWidth={1.8} />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
