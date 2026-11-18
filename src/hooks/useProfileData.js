import { useCallback, useEffect, useState } from "react";
import {
  createMyClaim,
  deleteMyClaim,
  getMyCandidateProfile,
  getMyCandidateRecord,
  getMyClaims,
  reviewMyClaim,
  updateMyCandidateRecord,
  updateMyClaim,
} from "../api/candidateApi";
import { getDocuments } from "../api/documentApi";
import {
  dismissMyExtractionReviewItem,
  getMyExtractionReviewItems,
  resolveMyExtractionReviewItem,
} from "../api/extractionApi";
import { SOURCES } from "../data/profileData";

const EMPTY_DATA = {
  profile: {
    fullName: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    employment: "",
    tags: [],
  },
  summary: { text: "", cut: false, sources: [] },
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
  languages: [],
  pendingClaims: [],
  documents: [],
  reviewItems: [],
};

const CLAIM_TYPES = {
  skills: "skill",
  experience: "employment",
  education: "education",
  projects: "project",
  certifications: "certification",
  languages: "language",
};

const EXPORTED_SOURCE_COLLECTIONS = [
  "skills",
  "employment",
  "education",
  "projects",
  "certifications",
  "languages",
];

function sourceIdsFor(record, exportedClaim) {
  if (record.origin === "manual") return ["manual"];
  const exportedSourceIds = Array.isArray(exportedClaim?.sources)
    ? exportedClaim.sources.map((source) => source.documentId).filter(Boolean)
    : [];
  const sourceIds =
    exportedSourceIds.length > 0
      ? exportedSourceIds
      : [record.extraction?.sourceDocumentId].filter(Boolean);

  return [...new Set(sourceIds)];
}

function mapClaim(record, exportedClaim) {
  const values = record.values ?? {};
  const common = {
    id: record.claimId,
    _version: record.version,
    status: record.status,
    origin: record.origin,
    sources: sourceIdsFor(record, exportedClaim),
  };

  switch (record.claimType) {
    case "skill":
      return { ...common, name: values.name ?? "" };
    case "employment":
      return {
        ...common,
        title: values.jobTitle ?? "",
        employer: values.employer ?? "",
        start: values.startDate ?? "",
        end: values.endDate ?? "",
        current: !values.endDate,
        location: values.location ?? "",
        description: values.description ?? "",
        skills: values.skills ?? [],
      };
    case "education":
      return {
        ...common,
        degree: values.degree ?? "",
        field: values.fieldOfStudy ?? "",
        school: values.institution ?? "",
        start: values.startDate ?? "",
        end: values.endDate ?? "",
      };
    case "project":
      return {
        ...common,
        name: values.name ?? "",
        org: values.role ?? "",
        start: values.startDate ?? "",
        end: values.endDate ?? "",
        current: !values.endDate,
        link: values.url ?? "",
        description: values.description ?? "",
        skills: values.skills ?? [],
      };
    case "certification":
      return {
        ...common,
        name: values.title ?? "",
        issuer: values.issuer ?? "",
        date: values.issueDate ?? "",
        expiryDate: values.expiryDate ?? "",
        credentialId: values.credentialId ?? "",
      };
    case "language":
      return {
        ...common,
        name: values.name ?? "",
        proficiency: values.proficiency ?? "",
      };
    default:
      return null;
  }
}

function mapProfile(candidate, previous = {}) {
  const links = Array.isArray(candidate.profileLinks) ? candidate.profileLinks : [];
  const linkedin = links.find((link) =>
    link.label?.toLowerCase().includes("linkedin"),
  );

  return {
    fullName: candidate.fullName ?? "",
    title: candidate.headline ?? "",
    email: candidate.contactEmail ?? candidate.email ?? "",
    phone: candidate.phone ?? "",
    location: candidate.location ?? "",
    linkedin: linkedin?.url ?? "",
    employment: "",
    tags: previous.tags ?? [],
  };
}

function withoutBlankOptionalValues(values) {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([, value]) => value !== "" && value !== null && value !== undefined,
    ),
  );
}

function valuesForClaim(key, item) {
  switch (CLAIM_TYPES[key]) {
    case "skill":
      return { name: item.name };
    case "employment":
      return withoutBlankOptionalValues({
        employer: item.employer,
        jobTitle: item.title,
        startDate: item.start,
        endDate: item.current ? "" : item.end,
        location: item.location,
        description: item.description,
        skills: item.skills,
      });
    case "education":
      return withoutBlankOptionalValues({
        institution: item.school,
        degree: item.degree,
        fieldOfStudy: item.field,
        startDate: item.start,
        endDate: item.end,
      });
    case "project":
      return withoutBlankOptionalValues({
        name: item.name,
        role: item.org,
        startDate: item.start,
        endDate: item.current ? "" : item.end,
        url: item.link,
        description: item.description,
        skills: item.skills,
      });
    case "certification":
      return withoutBlankOptionalValues({
        title: item.name,
        issuer: item.issuer,
        issueDate: item.date,
        expiryDate: item.expiryDate,
        credentialId: item.credentialId,
      });
    case "language":
      return withoutBlankOptionalValues({
        name: item.name,
        proficiency: item.proficiency,
      });
    default:
      throw new Error(`Unsupported profile collection: ${key}`);
  }
}

function mapData(candidate, claims, exportedProfile, documents, reviewItems) {
  const exportedById = new Map(
    EXPORTED_SOURCE_COLLECTIONS.flatMap((key) => exportedProfile?.[key] ?? []).map(
      (claim) => [claim.claimId, claim],
    ),
  );
  const collections = {
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
  };
  const pendingClaims = [];

  for (const record of claims) {
    if (record.status === "rejected") continue;
    const key = Object.keys(CLAIM_TYPES).find(
      (collection) => CLAIM_TYPES[collection] === record.claimType,
    );
    if (!key) continue;

    const item = mapClaim(record, exportedById.get(record.claimId));
    if (!item) continue;
    if (record.status === "accepted") {
      collections[key].push(item);
    } else if (record.status === "pending") {
      pendingClaims.push({ ...item, _collection: key });
    }
  }

  for (const document of documents) {
    if (document.documentId) {
      SOURCES[document.documentId] = {
        label: document.originalFilename || "Source document",
      };
    }
  }

  return {
    ...EMPTY_DATA,
    profile: {
      ...mapProfile(candidate),
      tags: collections.skills.slice(0, 4).map((skill) => skill.name),
    },
    summary: {
      text: candidate.summary ?? "",
      cut: false,
      sources: [],
    },
    ...collections,
    pendingClaims,
    documents,
    reviewItems,
  };
}

function profilePatch(changes, candidate) {
  const patch = {};

  if ("fullName" in changes) patch.fullName = changes.fullName;
  if ("title" in changes) patch.headline = changes.title || null;
  if ("email" in changes) patch.contactEmail = changes.email || null;
  if ("phone" in changes) patch.phone = changes.phone || null;
  if ("location" in changes) patch.location = changes.location || null;

  if ("linkedin" in changes) {
    const links = (candidate.profileLinks ?? []).filter(
      (link) => !link.label.toLowerCase().includes("linkedin"),
    );
    const url = changes.linkedin.trim();
    if (url) {
      links.push({
        label: "LinkedIn",
        url: /^https?:\/\//i.test(url) ? url : `https://${url}`,
      });
    }
    patch.profileLinks = links;
  }

  return patch;
}

export default function useProfileData() {
  const [d, setD] = useState(EMPTY_DATA);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [candidateRecord, claims, exportedProfile, documents, reviewItems] =
        await Promise.all([
          getMyCandidateRecord(),
          getMyClaims(),
          getMyCandidateProfile(),
          getDocuments(),
          getMyExtractionReviewItems(),
        ]);
      setCandidate(candidateRecord);
      setD(mapData(candidateRecord, claims, exportedProfile, documents, reviewItems));
    } catch (loadError) {
      setError(loadError.message || "Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const upd = async (key, id, changes) => {
    const item = d[key].find((record) => record.id === id);
    if (!item) throw new Error("This profile entry is no longer available.");

    const record = await updateMyClaim(
      id,
      CLAIM_TYPES[key],
      valuesForClaim(key, { ...item, ...changes }),
      item._version,
    );
    const updatedItem = {
      ...mapClaim(record, null),
      sources: item.sources,
    };
    setD((state) => ({
      ...state,
      [key]: state[key].map((entry) => (entry.id === id ? updatedItem : entry)),
    }));
  };

  const add = async (key, item) => {
    const record = await createMyClaim(
      CLAIM_TYPES[key],
      valuesForClaim(key, item),
    );
    const createdItem = mapClaim(record, null);
    setD((state) => ({
      ...state,
      [key]: [...state[key], createdItem],
      ...(key === "skills"
        ? {
            profile: {
              ...state.profile,
              tags: [...state[key].map((skill) => skill.name), createdItem.name].slice(0, 4),
            },
          }
        : {}),
    }));
  };

  const del = async (key, id) => {
    const item = d[key].find((record) => record.id === id);
    if (!item) throw new Error("This profile entry is no longer available.");
    await deleteMyClaim(id, item._version);
    setD((state) => ({
      ...state,
      [key]: state[key].filter((record) => record.id !== id),
      ...(key === "skills"
        ? {
            profile: {
              ...state.profile,
              tags: state[key]
                .filter((skill) => skill.id !== id)
                .slice(0, 4)
                .map((skill) => skill.name),
            },
          }
        : {}),
    }));
  };

  const resolveReviewItem = async (id, values, version) => {
    const result = await resolveMyExtractionReviewItem(id, values, version);
    const collectionByType = {
      skill: "skills",
      employment: "experience",
      education: "education",
      certification: "certifications",
      language: "languages",
      project: "projects",
    };
    const collection = collectionByType[result.claim.claimType];
    if (!collection) throw new Error("The resolved claim type is not supported.");
    const item = mapClaim(result.claim, null);
    setD((state) => ({
      ...state,
      reviewItems: state.reviewItems.filter(
        (reviewItem) => reviewItem.reviewItemId !== id,
      ),
      [collection]: [
        ...state[collection].filter((entry) => entry.id !== item.id),
        item,
      ],
    }));
  };

  const dismissReviewItem = async (id, version) => {
    await dismissMyExtractionReviewItem(id, version);
    setD((state) => ({
      ...state,
      reviewItems: state.reviewItems.filter(
        (reviewItem) => reviewItem.reviewItemId !== id,
      ),
    }));
  };

  const reviewClaim = async (key, id, status) => {
    const item = d.pendingClaims.find((record) => record.id === id);
    if (!item) throw new Error("This profile entry is no longer available.");
    const record = await reviewMyClaim(id, status, item._version);
    if (status === "rejected") {
      setD((state) => ({
        ...state,
        pendingClaims: state.pendingClaims.filter((entry) => entry.id !== id),
      }));
      return;
    }
    const updatedItem = { ...mapClaim(record, null), sources: item.sources };
    setD((state) => ({
      ...state,
      pendingClaims: state.pendingClaims.filter((entry) => entry.id !== id),
      [key]: [...state[key].filter((entry) => entry.id !== id), updatedItem],
      ...(key === "skills"
        ? {
            profile: {
              ...state.profile,
              tags: [...state.skills, updatedItem]
                .slice(0, 4)
                .map((skill) => skill.name),
            },
          }
        : {}),
    }));
  };

  const merge = async (key, changes) => {
    if (!candidate) throw new Error("The candidate profile has not loaded.");

    if (key === "profile") {
      const patch = profilePatch(changes, candidate);
      if (Object.keys(patch).length === 0) {
        setD((state) => ({
          ...state,
          profile: { ...state.profile, ...changes },
        }));
        return;
      }

      const updatedCandidate = await updateMyCandidateRecord(
        patch,
        candidate.version,
      );
      setCandidate(updatedCandidate);
      setD((state) => ({
        ...state,
        profile: mapProfile(updatedCandidate, {
          ...state.profile,
          tags: state.skills.slice(0, 4).map((skill) => skill.name),
        }),
      }));
      return;
    }

    if (key === "summary") {
      const updatedCandidate = await updateMyCandidateRecord(
        { summary: changes.text || null },
        candidate.version,
      );
      setCandidate(updatedCandidate);
      setD((state) => ({
        ...state,
        summary: { ...state.summary, ...changes, text: updatedCandidate.summary ?? "" },
      }));
      return;
    }

    throw new Error(`Unsupported profile field group: ${key}`);
  };

  return {
    d,
    setD,
    loading,
    error,
    reload,
    upd,
    add,
    del,
    merge,
    resolveReviewItem,
    dismissReviewItem,
    reviewClaim,
  };
}
