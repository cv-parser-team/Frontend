import { apiRequest } from "./axiosClient";

export async function getMyExtractionReviewItems(documentId) {
  const query = new URLSearchParams({ status: "pending" });
  if (documentId) query.set("documentId", documentId);
  const response = await apiRequest(
    `/api/candidates/me/extraction-review-items?${query}`
  );

  if (!Array.isArray(response?.data)) {
    throw new Error("Unexpected response while loading extraction review items.");
  }

  return response.data;
}

export async function resolveMyExtractionReviewItem(reviewItemId, values, version) {
  const response = await apiRequest(
    `/api/candidates/me/extraction-review-items/${encodeURIComponent(reviewItemId)}/resolve`,
    {
      method: "POST",
      headers: version ? { "If-Match": `"${version}"` } : {},
      body: JSON.stringify({ values }),
    }
  );

  if (
    !response?.data?.reviewItem?.reviewItemId ||
    response.data.reviewItem.status !== "resolved" ||
    !response.data.claim?.claimId
  ) {
    throw new Error("Unexpected response while resolving the extraction issue.");
  }

  return response.data;
}

export async function dismissMyExtractionReviewItem(reviewItemId, version) {
  const response = await apiRequest(
    `/api/candidates/me/extraction-review-items/${encodeURIComponent(reviewItemId)}/dismiss`,
    {
      method: "PATCH",
      headers: version ? { "If-Match": `"${version}"` } : {},
    }
  );

  if (
    response?.data?.reviewItemId !== reviewItemId ||
    response.data.status !== "dismissed"
  ) {
    throw new Error("Unexpected response while dismissing the extraction issue.");
  }

  return response.data;
}
