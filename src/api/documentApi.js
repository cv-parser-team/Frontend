
import {
  apiRequest,
  getToken,
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


export function uploadDocument(file, onProgress) {
  return new Promise((resolve, reject) => {
    const token = getToken();

    if (!token) {
      reject(new Error("Please sign in first."));
      return;
    }

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
    xhr.onload = () => {
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
