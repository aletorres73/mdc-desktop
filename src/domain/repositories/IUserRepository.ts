import type { UserModel } from "@/domain/entities/user";

export interface IUserRepository {
  getUser(uid: string): Promise<UserModel | null>;
  createUser(user: UserModel): Promise<void>;
  updateUser(uid: string, data: Partial<UserModel>): Promise<void>;
}
