
import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { getMyCandidateProfile, getMyClaimMergeCandidates } from "../api/candidateApi";
import { SOURCE_UPLOADED_EVENT } from "../api/documentApi";
import { getCurrentUser } from "../api/userApi";
import useProfileData from "../hooks/useProfileData";
import { groupMergeProposals } from "../utils/coalesceUtils";
import { getGroupedProfileIssues } from "../utils/profileIssues";

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
  const profileStore = useProfileData();
  const { d: profileData, reload: reloadProfile } = profileStore;
  const [mergeCandidates, setMergeCandidates] = useState([]);
  const [mergeCandidatesError, setMergeCandidatesError] = useState("");
  const [mergeCandidatesLoading, setMergeCandidatesLoading] = useState(true);
  const [account, setAccount] = useState({
    name: "Loading account...",
    title: "",
    initials: "...",
  });

  const loadMergeCandidates = useCallback(async () => {
    setMergeCandidatesLoading(true);
    setMergeCandidatesError("");
    try {
      setMergeCandidates(await getMyClaimMergeCandidates());
    } catch (error) {
      setMergeCandidatesError(error.message || "Unable to load duplicate groups.");
      console.error("Failed to load issue counts.", error);
    } finally {
      setMergeCandidatesLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getMyClaimMergeCandidates()
      .then((candidates) => {
        if (active) setMergeCandidates(candidates);
      })
      .catch((error) => {
        if (!active) return;
        setMergeCandidatesError(error.message || "Unable to load duplicate groups.");
        console.error("Failed to load issue counts.", error);
      })
      .finally(() => {
        if (active) setMergeCandidatesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const mergeGroups = useMemo(
    () => groupMergeProposals(mergeCandidates),
    [mergeCandidates]
  );
  const issueCount = useMemo(() => {
    return getGroupedProfileIssues(profileData, mergeGroups).issues.length +
      mergeGroups.length;
  }, [profileData, mergeGroups]);

  useEffect(() => {
    const refreshProfileAfterUpload = () => {
      reloadProfile();
      loadMergeCandidates();
    };
    window.addEventListener(SOURCE_UPLOADED_EVENT, refreshProfileAfterUpload);
    return () => {
      window.removeEventListener(SOURCE_UPLOADED_EVENT, refreshProfileAfterUpload);
    };
  }, [loadMergeCandidates, reloadProfile]);

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
      <Sidebar
        account={account}
        issueCount={
          profileStore.loading || profileStore.error || mergeCandidatesLoading
            ? undefined
            : mergeCandidatesError
              ? undefined
              : issueCount
        }
      />

      <div className="dashboard-main">
        <Navbar account={account} />
        <Outlet
          context={{
            store: profileStore,
            mergeCandidates,
            setMergeCandidates,
            mergeCandidatesError,
            loadMergeCandidates,
          }}
        />
      </div>
    </div>
  );
}
