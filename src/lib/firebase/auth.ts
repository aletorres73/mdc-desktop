import { AUTH_ENDPOINT, FIREBASE_CONFIG } from "./config";
import type {
  FirebaseAuthResponse,
  FirebaseAuthError,
  TokenRefreshResponse,
} from "./types";

function isFirebaseError(
  data: unknown
): data is FirebaseAuthError {
  return (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as FirebaseAuthError).error === "object"
  );
}

/**
 * Sign in with email and password via Firebase REST API
 * Mirrors DesktopAuthRepository.signIn()
 */
export async function signIn(
  email: string,
  password: string
): Promise<FirebaseAuthResponse> {
  const response = await fetch(
    `${AUTH_ENDPOINT}:signInWithPassword?key=${FIREBASE_CONFIG.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok || isFirebaseError(data)) {
    const message =
      isFirebaseError(data) ? data.error.message : "Error al iniciar sesión";
    throw new Error(message);
  }

  return data as FirebaseAuthResponse;
}

/**
 * Sign up with email, password and display name
 * Mirrors DesktopAuthRepository.signUp()
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseAuthResponse> {
  const response = await fetch(
    `${AUTH_ENDPOINT}:signUp?key=${FIREBASE_CONFIG.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        displayName,
        returnSecureToken: true,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok || isFirebaseError(data)) {
    const message =
      isFirebaseError(data) ? data.error.message : "Error al registrar";
    throw new Error(message);
  }

  return data as FirebaseAuthResponse;
}

/**
 * Refresh the ID token using refresh token
 * Mirrors DesktopAuthRepository.refreshIdToken()
 * Uses securetoken.googleapis.com (NOT identitytoolkit) — matches Kotlin desktop
 */
export async function refreshIdToken(
  refreshToken: string
): Promise<TokenRefreshResponse> {
  // Kotlin uses: https://securetoken.googleapis.com/v1/token?key=$apiKey
  const url = `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_CONFIG.apiKey}`;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await response.json();

  if (!response.ok || isFirebaseError(data)) {
    const message =
      isFirebaseError(data)
        ? data.error.message
        : "Error al refrescar el token";
    throw new Error(message);
  }

  return data as TokenRefreshResponse;
}

/**
 * Delete user account
 */
export async function deleteUser(idToken: string): Promise<void> {
  const response = await fetch(
    `${AUTH_ENDPOINT}:delete?key=${FIREBASE_CONFIG.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );

  if (!response.ok) {
    const data = await response.json();
    const message = isFirebaseError(data)
      ? data.error.message
      : "Error al eliminar cuenta";
    throw new Error(message);
  }
}

/**
 * Update user password
 * Mirrors DesktopAuthRepository.updatePassword()
 */
export async function updatePassword(
  idToken: string,
  newPassword: string
): Promise<void> {
  const response = await fetch(
    `${AUTH_ENDPOINT}:update?key=${FIREBASE_CONFIG.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken,
        password: newPassword,
        returnSecureToken: true,
      }),
    }
  );

  if (!response.ok) {
    const data = await response.json();
    const message = isFirebaseError(data)
      ? data.error.message
      : "Error al actualizar contraseña";
    throw new Error(message);
  }
}
