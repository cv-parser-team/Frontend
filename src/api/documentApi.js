
import {
  apiRequest,
  ensureAccessToken,
  expireSession,
  refreshAccessToken,
} from "./axiosClient";

// --------------------------------------------------
// GET DOCUMENTS
// --------------------------------------------------

export async function getDocuments() {
  const response = await apiRequest(
    "/api/candidates/me/documents?purpose=source"
  );

  const data = response?.data;

  if (Array.isArray(data)) return data;

  return (
    data?.documents ||
    data?.items ||
    data?.results ||
    []
  );
}

// --------------------------------------------------
// UPLOAD DOCUMENT
// --------------------------------------------------


async function uploadDocumentAttempt(file, onProgress, canRetry) {
  const token = await ensureAccessToken();

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const baseUrl = (
      import.meta.env.VITE_API_BASE_URL ||
      "http://localhost:4000"
    ).replace(/\/$/, "");

    const xhr = new XMLHttpRequest();

    xhr.open(
      "POST",
      `${baseUrl}/api/candidates/me/documents?purpose=source`
    );
    xhr.withCredentials = true;

    // Authentication
    xhr.setRequestHeader(
      "Authorization",
      `Bearer ${token}`
    );

    // Upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentage = Math.round(
          (event.loaded / event.total) * 100
        );

        onProgress(percentage);
      }
    };

    // Successful or failed HTTP response
    xhr.onload = async () => {
      let response;

      try {
        response = xhr.responseText
          ? JSON.parse(xhr.responseText)
          : {};
      } catch {
        response = {};
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(response);
      } else {
        if (xhr.status === 401 && canRetry) {
          try {
            await refreshAccessToken(token);
            resolve(await uploadDocumentAttempt(file, onProgress, false));
          } catch (error) {
            reject(error);
          }
          return;
        }
        if (xhr.status === 401) expireSession();
        reject(
          new Error(
            response?.message ||
            response?.error ||
            `Upload failed with status ${xhr.status}`
          )
        );
      }
    };

    // Network error
    xhr.onerror = () => {
      reject(new Error("Unable to connect to the server."));
    };

    xhr.ontimeout = () => {
      reject(new Error("Upload request timed out."));
    };

    xhr.timeout = 120000;

    // Do not manually set Content-Type for FormData.
    // The browser adds the required multipart boundary.
    xhr.send(formData);
  });
}

export function uploadDocument(file, onProgress) {
  return uploadDocumentAttempt(file, onProgress, true);
}


// --------------------------------------------------
// GET SINGLE DOCUMENT
// --------------------------------------------------

export async function getDocument(documentId) {
  const response = await apiRequest(
    `/api/candidates/me/documents/${encodeURIComponent(
      documentId
    )}`
  );

  return response.data;
}

// --------------------------------------------------
// DELETE DOCUMENT
// --------------------------------------------------

export async function deleteDocument(documentId) {
  return apiRequest(
    `/api/candidates/me/documents/${encodeURIComponent(
      documentId
    )}`,
    {
      method: "DELETE",
    }
  );
}
