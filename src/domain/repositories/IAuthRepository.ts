import type { AppUser } from "@/domain/entities/user";

export interface IAuthRepository {
  signIn(email: string, password: string): Promise<AppUser>;
  signUp(email: string, password: string): Promise<AppUser>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  getCurrentUser(): AppUser | null;
  onAuthStateChanged(callback: (user: AppUser | null) => void): () => void;
}
