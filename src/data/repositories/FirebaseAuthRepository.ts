import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
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

  getCurrentUser(): AppUser | null {
    return toAppUser(auth.currentUser);
  }

  onAuthStateChanged(callback: (user: AppUser | null) => void): () => void {
    return firebaseOnAuthStateChanged(auth, (user) => callback(toAppUser(user)));
  }
}
