import type { AppUser } from "../entities/user";

export interface IAuthRepository {
  signIn(email: string, password: string): Promise<AppUser>;
  signUp(email: string, password: string, displayName?: string): Promise<AppUser>;
  signOut(): Promise<void>;
  updatePassword(newPassword: string): Promise<void>;
  reauthenticate(password: string): Promise<void>;
  deleteUser(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  onAuthStateChange(callback: (user: AppUser | null) => void): () => void;
}
