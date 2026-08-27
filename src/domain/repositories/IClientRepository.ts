import type { ClientModel } from "../entities/client";

export interface IClientRepository {
  getAllClients(uid: string): Promise<ClientModel[]>;
  getClientById(uid: string, clientId: string): Promise<ClientModel | null>;
  createClient(uid: string, client: ClientModel): Promise<ClientModel>;
  updateClient(uid: string, client: ClientModel): Promise<ClientModel>;
  deleteClient(uid: string, clientId: string): Promise<string>;
}
