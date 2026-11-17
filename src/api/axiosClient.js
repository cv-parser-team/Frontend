
const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

// One token key for the entire application
export const TOKEN_KEY = "luminaCV_token";

export function saveToken(token) {
  if (!token) {
    throw new Error("Cannot save an empty access token.");
  }

  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// --------------------------------------------------
// API REQUEST
// --------------------------------------------------


export async function apiRequest(endpoint, options = {}) {
  const {
    auth = true,
    ...requestOptions
  } = options;

  const token = getToken();

  // Check authentication before sending the request
  if (auth && !token) {
    throw new ApiError(
      "No access token found. Please sign in again.",
      401,
      "NO_TOKEN"
    );
  }

  const isFormData =
    requestOptions.body instanceof FormData;

  const headers = {
    Accept: "application/json",

    ...(requestOptions.body && !isFormData
      ? { "Content-Type": "application/json" }
      : {}),

    ...(auth
      ? { Authorization: `Bearer ${token}` }
      : {}),

    ...requestOptions.headers,
  };

  const url = `${BASE_URL}/${endpoint.replace(/^\/+/, "")}`;

  let response;

  try {
    response = await fetch(url, {
      ...requestOptions,
      headers,
    });
  } catch {
    throw new ApiError(
      "Unable to connect to the server.",
      0,
      "SERVER_ERROR"
    );
  }

  const data =
    response.status === 204
      ? null
      : await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data?.message ||
      data?.error?.message ||
      data?.error ||
      "Request failed.",
      response.status,
      data?.code
    );
  }

  return data;
}

