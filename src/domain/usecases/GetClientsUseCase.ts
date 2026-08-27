import type { IClientRepository } from "../repositories/IClientRepository";
import type { ClientModel, ClientFilters } from "../entities/client";

export class GetClientsUseCase {
  constructor(private clientRepo: IClientRepository) {}

  async getAllClients(uid: string): Promise<ClientModel[]> {
    return this.clientRepo.getAllClients(uid);
  }

  async searchClients(uid: string, filters: ClientFilters): Promise<ClientModel[]> {
    const clients = await this.clientRepo.getAllClients(uid);
    if (!filters.search || filters.search.trim() === "") {
      return clients;
    }
    const query = filters.search.toLowerCase().trim();
    return clients.filter(
      (c) =>
        c.clientName.toLowerCase().includes(query) ||
        (c.fantasyName && c.fantasyName.toLowerCase().includes(query)) ||
        (c.cuit && c.cuit.includes(query))
    );
  }

  async getClientById(uid: string, clientId: string): Promise<ClientModel | null> {
    return this.clientRepo.getClientById(uid, clientId);
  }

  async createClient(uid: string, client: ClientModel): Promise<ClientModel> {
    if (!client.clientId || !client.clientName) {
      throw new Error("El ID y la razón social del cliente son obligatorios");
    }
    const existing = await this.clientRepo.getClientById(uid, client.clientId);
    if (existing) {
      throw new Error(`Ya existe un cliente con ID ${client.clientId}`);
    }
    return this.clientRepo.createClient(uid, client);
  }

  async updateClient(uid: string, client: ClientModel): Promise<ClientModel> {
    return this.clientRepo.updateClient(uid, client);
  }

  async deleteClient(uid: string, clientId: string): Promise<string> {
    return this.clientRepo.deleteClient(uid, clientId);
  }
}
