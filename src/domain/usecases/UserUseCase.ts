import type { IUserRepository } from "../repositories/IUserRepository";
import type { UserModel } from "../entities/user";

export class UserUseCase {
  constructor(private userRepo: IUserRepository) {}

  async getUserProfile(uid: string): Promise<UserModel | null> {
    return this.userRepo.getUserProfile(uid);
  }

  async updateUserProfile(uid: string, data: Partial<UserModel>): Promise<void> {
    return this.userRepo.updateUserProfile(uid, data);
  }
}
