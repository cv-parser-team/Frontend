
import {
  apiRequest,
  ApiError,
  saveToken,
  getToken,
  clearSession,
  ensureAccessToken,
  isTokenExpired,
} from "./axiosClient";
import { getMyCandidateRecord } from "./candidateApi.js";

// --------------------------------------------------
// AUTH ERROR
// --------------------------------------------------

export class AuthError extends ApiError {
  constructor(code, message = code, status = 0) {
    super(message, status, code);
    this.name = "AuthError";
  }
}

// --------------------------------------------------
// SAVE AUTHENTICATION DATA
// --------------------------------------------------

function saveAuth(response) {
  const authData = response?.data;

  if (!authData?.accessToken || !authData?.userId) {
    throw new AuthError(
      "INVALID_RESPONSE",
      "The server did not return valid authentication data."
    );
  }

  saveToken(authData.accessToken);

  localStorage.setItem("luminaCV_userId", authData.userId);

  return authData;
}

// --------------------------------------------------
// HANDLE AUTHENTICATION ERRORS
// --------------------------------------------------

function handleAuthError(error, endpoint) {
  if (error instanceof AuthError) {
    throw error;
  }

  if (error.status === 409) {
    throw new AuthError(
      "EMAIL_EXISTS",
      error.message,
      error.status
    );
  }

  if (error.status === 401 && endpoint === "sign-in") {
    throw new AuthError(
      "INVALID_CREDENTIALS",
      "Email or password is incorrect.",
      401
    );
  }

  if (error.status === 400) {
    throw new AuthError(
      "VALIDATION_ERROR",
      error.message,
      400
    );
  }

  if (error.status === 401) {
    throw new AuthError(
      "UNAUTHORIZED",
      error.message || "Authentication required.",
      401
    );
  }

  throw new AuthError(
    "SERVER_ERROR",
    error.message || "Authentication failed.",
    error.status || 0
  );
}

// --------------------------------------------------
// LOGIN
// --------------------------------------------------

export async function login({ email, password }) {
  try {
    const response = await apiRequest(
      "/api/auth/sign-in",
      {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      }
    );

    return saveAuth(response);
  } catch (error) {
    handleAuthError(error, "sign-in");
  }
}

// --------------------------------------------------
// CREATE CANDIDATE
// --------------------------------------------------

export async function createCandidate(fullName, email) {
  if (typeof email !== "string" || !email.trim()) {
    throw new AuthError(
      "INVALID_CANDIDATE_EMAIL",
      "An email address is required to create the candidate profile."
    );
  }

  try {
    const response = await apiRequest(
      "/api/candidates/me",
      {
        method: "POST",
        body: JSON.stringify({
          fullName: fullName.trim(),
          contactEmail: email.trim().toLowerCase(),
        }),
      }
    );

    return response?.data ?? response;
  } catch (error) {
    throw new AuthError(
      "CANDIDATE_CREATION_FAILED",
      error.message ||
        "Your account was created, but candidate profile creation failed.",
      error.status || 0
    );
  }
}

async function createCandidateOrLoadExisting(fullName, email) {
  try {
    return await createCandidate(fullName, email);
  } catch (error) {
    if (error?.status !== 409) throw error;
    return getMyCandidateRecord();
  }
}

// --------------------------------------------------
// SIGN UP
// --------------------------------------------------

export async function signUp({
  fullName,
  email,
  password,
}) {
  try {
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    let authData;
    let existingAccount = false;

    try {
      const response = await apiRequest(
        "/api/auth/register",
        {
          method: "POST",
          auth: false,
          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            password,
          }),
        }
      );
      authData = saveAuth(response);
    } catch (error) {
      if (error?.status !== 409) throw error;

      // A prior signup may have created the user but failed before creating
      // the candidate profile. Sign in to safely complete that account.
      authData = await login({ email: cleanEmail, password });
      existingAccount = true;
    }

    let candidate;
    if (existingAccount) {
      try {
        candidate = await getMyCandidateRecord();
      } catch (error) {
        if (error?.status !== 404) throw error;
        candidate = await createCandidateOrLoadExisting(cleanName, cleanEmail);
      }
    } else {
      candidate = await createCandidateOrLoadExisting(cleanName, cleanEmail);
    }

    return {
      ...authData,
      candidate,
    };

  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    handleAuthError(error, "register");
  }
}

// --------------------------------------------------
// LOGOUT
// --------------------------------------------------

export async function logout() {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } finally {
    clearSession();
  }
}

export async function changePassword(currentPassword, newPassword) {
  const response = await apiRequest("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const authData = response?.data;

  if (!authData?.accessToken || !authData?.userId) {
    throw new AuthError(
      "INVALID_RESPONSE",
      "The server did not return a valid session after changing the password."
    );
  }

  saveToken(authData.accessToken);
  return authData;
}

// --------------------------------------------------
// GET TOKEN
// --------------------------------------------------

export function getAuthToken() {
  return getToken();
}

// --------------------------------------------------
// GET USER ID
// --------------------------------------------------

export function getUserId() {
  return localStorage.getItem("luminaCV_userId");
}

// --------------------------------------------------
// CHECK AUTHENTICATION
// --------------------------------------------------

export function isAuthenticated() {
  const token = getToken();
  return Boolean(token && !isTokenExpired(token));
}

export async function restoreSession() {
  await ensureAccessToken();
  return true;
}
