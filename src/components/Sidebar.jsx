
import { useState } from "react";
import { NavLink } from "react-router-dom";

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
} from "lucide-react";

import "./Sidebar.css";

const navigationItems = [
  {
    label: "Profile",
    path: "/profile",
    icon: UserRound,
    count: 248,
  },
  {
    label: "Import & Upload",
    path: "/upload",
    icon: Upload,
  },
  {
    label: "Sources",
    path: "/sources",
    icon: Layers,
  },
  {
    label: "Review Center",
    path: "/review",
    icon: CircleCheck,
    count: 5,
  },
  {
    label: "History & Activity",
    path: "/history",
    icon: Clock,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: SlidersHorizontal,
  },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const closeSidebar = () => setIsOpen(false);

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
            <Network size={22} strokeWidth={2} />
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

        {/* User Profile */}
        <div className="sidebar-user">
          <div className="user-avatar">
            JD
          </div>

          <div className="user-info">
            <h3>Johan Doe</h3>
            <p>software engineer</p>
          </div>
        </div>
      </aside>
    </>
  );
}
