
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { getMyCandidateProfile, getMyClaimMergeCandidates } from "../api/candidateApi";
import { getDocuments, SOURCE_UPLOADED_EVENT } from "../api/documentApi";
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
  const sourceStatusById = useRef(new Map());
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
    const processingStatuses = new Set(["stored", "processing", "pending", "queued"]);
    const finishedStatuses = new Set(["ready", "completed", "failed"]);

    const pollSourceStatuses = async () => {
      if (document.visibilityState !== "visible") return;

      try {
        const documents = await getDocuments();
        if (!active) return;

        let processingFinished = false;
        for (const source of documents) {
          if (!source?.documentId) continue;

          const status = String(source.status || "").toLowerCase();
          const previousStatus =
            sourceStatusById.current.get(source.documentId);

          if (
            previousStatus &&
            processingStatuses.has(previousStatus) &&
            finishedStatuses.has(status)
          ) {
            processingFinished = true;
          }

          sourceStatusById.current.set(source.documentId, status);
        }

        if (processingFinished) {
          await reloadProfile({ background: true });
          await loadMergeCandidates();
        }
      } catch (error) {
        console.error("Failed to refresh document processing status.", error);
      }
    };

    pollSourceStatuses();
    const intervalId = window.setInterval(pollSourceStatuses, 5000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
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
