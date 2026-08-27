import type { IUserRepository } from "@/domain/repositories/IUserRepository";
import type { UserModel } from "@/domain/entities/user";
import { getDocument, updateDocument } from "../datasources";

export class FirestoreUserRepository implements IUserRepository {
  async getUserProfile(uid: string): Promise<UserModel | null> {
    return getDocument<UserModel>("users", uid);
  }

  async updateUserProfile(uid: string, data: Partial<UserModel>): Promise<void> {
    await updateDocument("users", uid, data as Record<string, unknown>);
  }
}
