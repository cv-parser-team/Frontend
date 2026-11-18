
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { getMyCandidateProfile } from "../api/candidateApi";
import { getCurrentUser } from "../api/userApi";

function getInitials(name) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export default function DashboardLayout() {
  const [account, setAccount] = useState({
    name: "Loading account...",
    title: "",
    initials: "...",
  });

  useEffect(() => {
    let active = true;
    const handleProfileUpdate = (event) => {
      const { fullName, headline } = event.detail ?? {};
      setAccount((current) => {
        const name = fullName || current.name;
        return {
          name,
          title: headline || "Candidate",
          initials: getInitials(name),
        };
      });
    };
    window.addEventListener("lumina:candidate-profile-updated", handleProfileUpdate);

    async function loadAccount() {
      const [userResult, profileResult] = await Promise.allSettled([
        getCurrentUser(),
        getMyCandidateProfile(),
      ]);

      if (!active) return;

      const userResponse =
        userResult.status === "fulfilled" ? userResult.value : null;
      const user =
        userResponse?.data?.user ?? userResponse?.data ?? userResponse;
      const profile =
        profileResult.status === "fulfilled" ? profileResult.value : null;
      const personalInfo = profile?.personalInfo ?? {};
      const name =
        personalInfo.fullName ??
        user?.name ??
        user?.fullName ??
        "Account unavailable";
      const title =
        personalInfo.headline ||
        user?.jobTitle ||
        user?.title ||
        (name === "Account unavailable"
          ? "Unable to load account details"
          : "Candidate");

      if (
        userResult.status === "rejected" &&
        profileResult.status === "rejected"
      ) {
        console.error("Failed to load account information.", userResult.reason);
      }

      setAccount({ name, title, initials: getInitials(name) });
    }

    loadAccount();
    return () => {
      active = false;
      window.removeEventListener(
        "lumina:candidate-profile-updated",
        handleProfileUpdate,
      );
    };
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar account={account} />

      <div className="dashboard-main">
        <Navbar account={account} />
        <Outlet />
      </div>
    </div>
  );
}
