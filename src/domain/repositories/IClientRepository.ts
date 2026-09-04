import type { ClientModel } from "@/domain/entities/client";

export interface IClientRepository {
  getClients(uid: string): Promise<ClientModel[]>;
  searchClientsByPrefix(uid: string, prefix: string): Promise<ClientModel[]>;
  getClient(uid: string, clientId: string): Promise<ClientModel | null>;
  createClient(uid: string, client: ClientModel): Promise<void>;
  updateClient(uid: string, clientId: string, data: Partial<ClientModel>): Promise<void>;
  deleteClient(uid: string, clientId: string): Promise<void>;
  suggestNextClientId(uid: string): Promise<string>;
}
