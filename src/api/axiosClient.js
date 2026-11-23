
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
export const SESSION_EXPIRED_EVENT = "luminacv:session-expired";
let refreshPromise = null;

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

export function clearSession() {
  clearToken();
  localStorage.removeItem("luminaCV_userId");
  localStorage.removeItem("luminaCV_user");
}

export function isTokenExpired(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;

    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const { exp } = JSON.parse(atob(base64));

    return typeof exp !== "number" || exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function expireSession() {
  clearSession();
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

export async function refreshAccessToken(staleToken) {
  const currentToken = getToken();
  if (
    staleToken &&
    currentToken &&
    currentToken !== staleToken &&
    !isTokenExpired(currentToken)
  ) {
    return currentToken;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      let response;
      try {
        response = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
      } catch {
        throw new ApiError(
          "Unable to refresh your session.",
          0,
          "SERVER_ERROR"
        );
      }

      const body = await response.json().catch(() => ({}));
      const authData = body?.data;
      if (!response.ok || !authData?.accessToken || !authData?.userId) {
        throw new ApiError(
          body?.message || body?.error?.message || "Your session has expired.",
          response.status,
          body?.code || "SESSION_EXPIRED"
        );
      }

      saveToken(authData.accessToken);
      localStorage.setItem("luminaCV_userId", authData.userId);
      return authData.accessToken;
    })()
      .catch((error) => {
        if (error.status !== 0 && error.status < 500) {
          expireSession();
        }
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function ensureAccessToken() {
  const token = getToken();
  return token && !isTokenExpired(token)
    ? token
    : refreshAccessToken(token);
}

// --------------------------------------------------
// API REQUEST
// --------------------------------------------------


export async function apiRequest(endpoint, options = {}, hasRetried = false) {
  const {
    auth = true,
    ...requestOptions
  } = options;

  const token = auth ? await ensureAccessToken() : null;

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
      credentials: "include",
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
    if (auth && response.status === 401) {
      if (!hasRetried) {
        await refreshAccessToken(token);
        return apiRequest(endpoint, options, true);
      }
      expireSession();
    }

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
