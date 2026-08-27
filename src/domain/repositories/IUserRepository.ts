import type { UserModel } from "../entities/user";

export interface IUserRepository {
  getUserProfile(uid: string): Promise<UserModel | null>;
  updateUserProfile(uid: string, data: Partial<UserModel>): Promise<void>;
}
