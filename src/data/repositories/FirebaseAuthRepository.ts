import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from "firebase/auth";
import { auth } from "@/data/datasources/config";
import type { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import type { AppUser } from "@/domain/entities/user";

function toAppUser(user: { uid: string; email: string | null; displayName: string | null } | null): AppUser | null {
  if (!user) return null;
  return { uid: user.uid, email: user.email, displayName: user.displayName };
}

export class FirebaseAuthRepository implements IAuthRepository {
  async signIn(email: string, password: string): Promise<AppUser> {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return toAppUser(cred.user)!;
  }

  async signUp(email: string, password: string): Promise<AppUser> {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return toAppUser(cred.user)!;
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user?.email) throw new Error("No hay una sesión de email activa.");

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  }

  getCurrentUser(): AppUser | null {
    return toAppUser(auth.currentUser);
  }

  onAuthStateChanged(callback: (user: AppUser | null) => void): () => void {
    return firebaseOnAuthStateChanged(auth, (user) => callback(toAppUser(user)));
  }
}
