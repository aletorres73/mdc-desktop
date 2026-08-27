import { app } from "./config";
import { 
  getAuth, 
  setPersistence, 
  indexedDBLocalPersistence,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
  deleteUser as firebaseDeleteUser,
  User as FirebaseUser
} from "firebase/auth";

export const auth = getAuth(app);
setPersistence(auth, indexedDBLocalPersistence).catch(console.error);

export async function signIn(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signUp(email: string, password: string, displayName?: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  return result.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export async function updateUserPassword(newPassword: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");
  await updatePassword(user, newPassword);
}

export async function reauthenticate(password: string) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("No user logged in");
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
}

export async function deleteCurrentUser() {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");
  await firebaseDeleteUser(user);
}

export async function sendPasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
