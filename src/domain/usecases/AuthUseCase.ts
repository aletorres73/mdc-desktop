import type { IAuthRepository } from "../repositories/IAuthRepository";
import type { AppUser } from "../entities/user";

export class AuthUseCase {
  constructor(private authRepo: IAuthRepository) {}

  async signIn(email: string, password: string): Promise<AppUser> {
    if (!email || !password) {
      throw new Error("Email y contraseña requeridos");
    }
    return this.authRepo.signIn(email, password);
  }

  async signUp(email: string, password: string, displayName?: string): Promise<AppUser> {
    if (!email || !password) {
      throw new Error("Email y contraseña requeridos");
    }
    return this.authRepo.signUp(email, password, displayName);
  }

  async signOut(): Promise<void> {
    return this.authRepo.signOut();
  }

  async updatePassword(newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres");
    }
    return this.authRepo.updatePassword(newPassword);
  }

  async reauthenticate(password: string): Promise<void> {
    return this.authRepo.reauthenticate(password);
  }

  async deleteUser(): Promise<void> {
    return this.authRepo.deleteUser();
  }

  async sendPasswordReset(email: string): Promise<void> {
    if (!email) throw new Error("Email requerido");
    return this.authRepo.sendPasswordReset(email);
  }

  onAuthStateChange(callback: (user: AppUser | null) => void): () => void {
    return this.authRepo.onAuthStateChange(callback);
  }
}
