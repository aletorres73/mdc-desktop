import { getDocument, setDocument, updateDocument } from "@/data/datasources/firestore";
import { toUserDomain, toUserRemote } from "@/data/mappers/userMapper";
import type { RemoteResultUserModel } from "@/data/remote/remoteUser";
import type { IUserRepository } from "@/domain/repositories/IUserRepository";
import type { UserModel } from "@/domain/entities/user";

export class FirestoreUserRepository implements IUserRepository {
  async getUser(uid: string): Promise<UserModel | null> {
    const remote = await getDocument<RemoteResultUserModel>("users", uid);
    return remote ? toUserDomain(remote) : null;
  }

  async createUser(user: UserModel): Promise<void> {
    await setDocument("users", user.uid, toUserRemote(user));
  }

  async updateUser(uid: string, data: Partial<UserModel>): Promise<void> {
    await updateDocument("users", uid, data);
  }
}
