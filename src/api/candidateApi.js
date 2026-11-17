
import { apiRequest } from "./axiosClient";

export async function getMyCandidateRecord() {
  const response = await apiRequest("/api/candidates/me");

  if (!response?.data?.candidateId || !Number.isInteger(response.data.version)) {
    throw new Error("Unexpected response while loading the candidate profile.");
  }

  return response.data;
}

export async function updateMyCandidateRecord(values, version) {
  const response = await apiRequest("/api/candidates/me", {
    method: "PATCH",
    headers: { "If-Match": `"${version}"` },
    body: JSON.stringify(values),
  });

  if (!response?.data?.candidateId || !Number.isInteger(response.data.version)) {
    throw new Error("Unexpected response while saving the candidate profile.");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("lumina:candidate-profile-updated", {
        detail: response.data,
      }),
    );
  }

  return response.data;
}

export async function getMyClaims(status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = await apiRequest(`/api/candidates/me/claims${query}`);

  if (!Array.isArray(response?.data)) {
    throw new Error("Unexpected response while loading claims.");
  }

  return response.data;
}

export async function createMyClaim(claimType, values) {
  const response = await apiRequest("/api/candidates/me/claims", {
    method: "POST",
    body: JSON.stringify({ type: claimType, values }),
  });

  if (!response?.data?.claimId || !Number.isInteger(response.data.version)) {
    throw new Error("Unexpected response while creating the claim.");
  }

  return response.data;
}

export async function updateMyClaim(claimId, claimType, values, version) {
  const response = await apiRequest(
    `/api/candidates/me/claims/${encodeURIComponent(claimId)}`,
    {
      method: "PUT",
      headers: { "If-Match": `"${version}"` },
      body: JSON.stringify({ type: claimType, values }),
    }
  );

  if (!response?.data?.claimId) {
    throw new Error("Unexpected response while saving the claim.");
  }
  if (!Number.isInteger(response.data.version)) {
    throw new Error("The server did not return the updated claim version.");
  }

  return response.data;
}

export async function reviewMyClaim(claimId, status, version) {
  const response = await apiRequest(
    `/api/candidates/me/claims/${encodeURIComponent(claimId)}/review`,
    {
      method: "PATCH",
      headers: { "If-Match": `"${version}"` },
      body: JSON.stringify({ status }),
    }
  );

  if (
    response?.data?.claimId !== claimId ||
    response.data.status !== status ||
    !Number.isInteger(response.data.version)
  ) {
    throw new Error("Unexpected response while saving the claim review.");
  }

  return response.data;
}

export async function deleteMyClaim(claimId, version) {
  await apiRequest(
    `/api/candidates/me/claims/${encodeURIComponent(claimId)}`,
    {
      method: "DELETE",
      headers: { "If-Match": `"${version}"` },
    }
  );
}

export async function getMyCandidateProfile() {
  const response = await apiRequest(
    "/api/candidates/me/profile",
    {
      method: "GET",
    }
  );

  const profile =
    response?.data?.candidate ??
    response?.data?.profile ??
    response?.data ??
    response;

  const claimCollections = [
    "skills",
    "employment",
    "education",
    "certifications",
    "languages",
    "projects",
  ];
  if (
    !profile?.personalInfo ||
    claimCollections.some((key) => !Array.isArray(profile[key]))
  ) {
    throw new Error("Unexpected response while loading exported profile data.");
  }

  return profile;
}
