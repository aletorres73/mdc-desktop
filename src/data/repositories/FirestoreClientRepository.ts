import {
  getCollection,
  getDocument,
  setDocument,
  updateDocument,
  deleteDocument,
  where,
  orderBy,
  limit,
} from "@/data/datasources/firestore";
import { toClientDomain, toClientRemote } from "@/data/mappers/clientMapper";
import type { RemoteResultClientModel } from "@/data/remote/remoteClient";
import type { IClientRepository } from "@/domain/repositories/IClientRepository";
import type { ClientModel } from "@/domain/entities/client";

export class FirestoreClientRepository implements IClientRepository {
  private path(uid: string) {
    return `users/${uid}/clients`;
  }

  async getClients(uid: string): Promise<ClientModel[]> {
    const remote = await getCollection<RemoteResultClientModel>(this.path(uid));
    return remote.map(toClientDomain);
  }

  async searchClientsByPrefix(uid: string, prefix: string): Promise<ClientModel[]> {
    const remote = await getCollection<RemoteResultClientModel>(this.path(uid), [
      where("Razón Social", ">=", prefix),
      where("Razón Social", "<", prefix + "\uf8ff"),
    ]);
    return remote.map(toClientDomain);
  }

  async getClient(uid: string, clientId: string): Promise<ClientModel | null> {
    const remote = await getDocument<RemoteResultClientModel>(this.path(uid), clientId);
    return remote ? toClientDomain(remote) : null;
  }

  async createClient(uid: string, client: ClientModel): Promise<void> {
    await setDocument(this.path(uid), client.clientId, toClientRemote(client));
  }

  async updateClient(uid: string, clientId: string, data: Partial<ClientModel>): Promise<void> {
    await updateDocument(this.path(uid), clientId, data);
  }

  async deleteClient(uid: string, clientId: string): Promise<void> {
    await deleteDocument(this.path(uid), clientId);
  }

  async suggestNextClientId(uid: string): Promise<string> {
    const remote = await getCollection<RemoteResultClientModel & { id: string }>(this.path(uid), [
      orderBy("Cliente Id", "desc"),
      limit(1),
    ]);
    const lastId = remote[0]?.["Cliente Id"];
    const lastNumber = lastId ? parseInt(lastId.replace(/\D/g, ""), 10) || 0 : 0;
    return `client_${lastNumber + 1}`;
  }
}
