import { getCollection, getDocument, setDocument, updateDocument, deleteDocument } from "@/data/datasources/firestore";
import { toFactoryDomain, toFactoryRemote } from "@/data/mappers/factoryMapper";
import type { RemoteResultFactoryModel } from "@/data/remote/remoteFactory";
import type { IFactoryRepository } from "@/domain/repositories/IFactoryRepository";
import type { FactoryModel } from "@/domain/entities/factory";

export class FirestoreFactoryRepository implements IFactoryRepository {
  private path(uid: string) {
    return `users/${uid}/factories`;
  }

  async getFactories(uid: string): Promise<FactoryModel[]> {
    const remote = await getCollection<RemoteResultFactoryModel>(this.path(uid));
    return remote.map(toFactoryDomain);
  }

  async getFactoryByName(uid: string, name: string): Promise<FactoryModel | null> {
    const remote = await getDocument<RemoteResultFactoryModel>(this.path(uid), name);
    return remote ? toFactoryDomain(remote) : null;
  }

  async createFactory(uid: string, factory: FactoryModel): Promise<void> {
    await setDocument(this.path(uid), factory.name, toFactoryRemote(factory));
  }

  async updateFactory(uid: string, name: string, data: Partial<FactoryModel>): Promise<void> {
    await updateDocument(this.path(uid), name, data);
  }

  async deleteFactory(uid: string, name: string): Promise<void> {
    await deleteDocument(this.path(uid), name);
  }
}
