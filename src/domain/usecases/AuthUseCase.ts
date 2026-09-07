import type { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import type { IUserRepository } from "@/domain/repositories/IUserRepository";
import type { AppUser, UserModel } from "@/domain/entities/user";

const TRIAL_DAYS = 7;

export class AuthUseCase {
  constructor(
    private authRepo: IAuthRepository,
    private userRepo: IUserRepository,
  ) {}

  async signIn(email: string, password: string): Promise<AppUser> {
    return this.authRepo.signIn(email, password);
  }

  async signUp(email: string, password: string, name: string, lastName: string): Promise<AppUser> {
    const user = await this.authRepo.signUp(email, password);
    const trialExpiresAt = Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000;
    const newUser: UserModel = {
      uid: user.uid,
      name,
      lastName,
      email,
      subscriptionExpiresAt: trialExpiresAt,
      isManuallyEnabled: false,
      paymentHistory: [],
    };
    await this.userRepo.createUser(newUser);
    return user;
  }

  async signOut(): Promise<void> {
    return this.authRepo.signOut();
  }

  async resetPassword(email: string): Promise<void> {
    return this.authRepo.resetPassword(email);
  }

  getCurrentUser(): AppUser | null {
    return this.authRepo.getCurrentUser();
  }

  onAuthStateChanged(callback: (user: AppUser | null) => void): () => void {
    return this.authRepo.onAuthStateChanged(callback);
  }

  isSubscriptionActive(user: UserModel | null): boolean {
    if (!user) return false;
    return user.isManuallyEnabled || user.subscriptionExpiresAt > Date.now();
  }
}
