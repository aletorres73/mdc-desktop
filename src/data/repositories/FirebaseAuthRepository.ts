import type { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import type { AppUser } from "@/domain/entities/user";
import {
  signIn as dsSignIn,
  signUp as dsSignUp,
  signOut as dsSignOut,
  updateUserPassword as dsUpdatePassword,
  reauthenticate as dsReauthenticate,
  deleteCurrentUser as dsDeleteUser,
  sendPasswordReset as dsSendReset,
  onAuthStateChange as dsOnAuthStateChange,
} from "../datasources";

export class FirebaseAuthRepository implements IAuthRepository {
  async signIn(email: string, password: string): Promise<AppUser> {
    const user = await dsSignIn(email, password);
    return {
      uid: user.uid,
      email: user.email ?? "",
      displayName: user.displayName ?? undefined,
    };
  }

  async signUp(email: string, password: string, displayName?: string): Promise<AppUser> {
    const user = await dsSignUp(email, password, displayName);
    return {
      uid: user.uid,
      email: user.email ?? "",
      displayName: user.displayName ?? undefined,
    };
  }

  async signOut(): Promise<void> {
    await dsSignOut();
  }

  async updatePassword(newPassword: string): Promise<void> {
    await dsUpdatePassword(newPassword);
  }

  async reauthenticate(password: string): Promise<void> {
    await dsReauthenticate(password);
  }

  async deleteUser(): Promise<void> {
    await dsDeleteUser();
  }

  async sendPasswordReset(email: string): Promise<void> {
    await dsSendReset(email);
  }

  onAuthStateChange(callback: (user: AppUser | null) => void): () => void {
    return dsOnAuthStateChange((user) => {
      if (!user) {
        callback(null);
      } else {
        callback({
          uid: user.uid,
          email: user.email ?? "",
          displayName: user.displayName ?? undefined,
        });
      }
    });
  }
}
