import type { IClientRepository } from "@/domain/repositories/IClientRepository";
import type { ClientModel } from "@/domain/entities/client";

export class ClientUseCase {
  constructor(private clientRepo: IClientRepository) {}

  getClients(uid: string): Promise<ClientModel[]> {
    return this.clientRepo.getClients(uid);
  }

  searchByPrefix(uid: string, prefix: string): Promise<ClientModel[]> {
    if (!prefix.trim()) return this.clientRepo.getClients(uid);
    return this.clientRepo.searchClientsByPrefix(uid, prefix);
  }

  getClient(uid: string, clientId: string): Promise<ClientModel | null> {
    return this.clientRepo.getClient(uid, clientId);
  }

  async createClient(uid: string, clientName: string): Promise<ClientModel> {
    const clientId = await this.clientRepo.suggestNextClientId(uid);
    const client: ClientModel = { clientId, clientName };
    await this.clientRepo.createClient(uid, client);
    return client;
  }

  updateClient(uid: string, clientId: string, data: Partial<ClientModel>): Promise<void> {
    return this.clientRepo.updateClient(uid, clientId, data);
  }

  deleteClient(uid: string, clientId: string): Promise<void> {
    return this.clientRepo.deleteClient(uid, clientId);
  }
}
