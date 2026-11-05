import { useState } from "react";
import "./Navbar.css";
import {
  Search,
  Bell,
  ChevronDown,
} from "lucide-react";

export default function Navbar() {
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

        <button className="account-button">
          <div className="account-avatar">
            AH
          </div>

          <ChevronDown size={14} />
        </button>

      </div>

    </header>
  );
}