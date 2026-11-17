import { useState } from "react";
import "./Navbar.css";
import {
  Search,
  Bell,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Navbar({ account }) {
  const [search, setSearch] = useState("");

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

        <Link className="account-button" to="/profile" aria-label="View profile">
          <div className="account-avatar">{account.initials}</div>
          <div className="account-info">
            <strong>{account.name}</strong>
            <span>{account.title}</span>
          </div>
          <ChevronDown size={14} />
        </Link>

      </div>

    </header>
  );
}