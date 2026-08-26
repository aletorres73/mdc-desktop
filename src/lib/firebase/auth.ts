import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail, deleteUser as firebaseDeleteUser, updatePassword as firebaseUpdatePassword, User } from "firebase/auth";
import { app } from "./config";
import type {
  FirebaseAuthResponse,
  TokenRefreshResponse,
} from "./types";

const auth = getAuth(app);

/**
 * Convert Firebase User to FirebaseAuthResponse format
 */
async function userToAuthResponse(user: User): Promise<FirebaseAuthResponse> {
  return {
    kind: "identitytoolkit#VerifyPasswordResponse",
    idToken: await user.getIdToken(),
    refreshToken: user.refreshToken,
    expiresIn: "3600",
    localId: user.uid,
    email: user.email || "",
    displayName: user.displayName || "",
    registered: true,
  };
}

/**
 * Sign in with email and password via Firebase SDK
 */
export async function signIn(
  email: string,
  password: string
): Promise<FirebaseAuthResponse> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userToAuthResponse(userCredential.user);
}

/**
 * Sign up with email, password and display name
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseAuthResponse> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName });
  return userToAuthResponse(userCredential.user);
}

/**
 * Refresh the ID token using refresh token
 */
export async function refreshIdToken(
  refreshToken: string
): Promise<TokenRefreshResponse> {
  // The Firebase SDK handles token refresh automatically
  // This is a compatibility function for existing code
  const user = auth.currentUser;
  if (!user) throw new Error("No user signed in");
  
  const idToken = await user.getIdToken(true); // force refresh
  return {
    access_token: idToken,
    expires_in: "3600",
    token_type: "Bearer",
    refresh_token: refreshToken,
    id_token: idToken,
    user_id: user.uid,
    project_id: app.options.projectId || "",
  };
}

/**
 * Delete user account
 */
export async function deleteUser(_idToken: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user signed in");
  await firebaseDeleteUser(user);
}

/**
 * Update user password
 */
export async function updatePassword(
  _idToken: string,
  newPassword: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user signed in");
  await firebaseUpdatePassword(user, newPassword);
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  await auth.signOut();
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
  return auth.onAuthStateChanged(callback);
}
