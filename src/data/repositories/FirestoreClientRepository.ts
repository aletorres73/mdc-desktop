import type { IClientRepository } from "@/domain/repositories/IClientRepository";
import type { ClientModel } from "@/domain/entities/client";
import { getCollection, getDocument, setDocument, updateDocument, deleteDocument } from "../datasources";
import type { RemoteResultClientModel } from "../remote/remoteResultClient";
import { toClientDomain, toClientRemote } from "../mappers/clientMapper";

function clientsPath(uid: string): string {
  return `users/${uid}/clients`;
}

export class FirestoreClientRepository implements IClientRepository {
  async getAllClients(uid: string): Promise<ClientModel[]> {
    const docs = await getCollection<RemoteResultClientModel>(clientsPath(uid));
    return docs.map(toClientDomain).sort((a, b) =>
      a.clientName.localeCompare(b.clientName, "es", { sensitivity: "base" })
    );
  }

  async getClientById(uid: string, clientId: string): Promise<ClientModel | null> {
    const directDoc = await getDocument<RemoteResultClientModel>(clientsPath(uid), clientId);
    if (directDoc) {
      return toClientDomain(directDoc);
    }
    const queryDocs = await getCollection<RemoteResultClientModel>(clientsPath(uid), {
      filters: [{ field: "Cliente Id", op: "=", value: clientId }],
      limit: 1,
    });
    if (queryDocs.length > 0) {
      return toClientDomain(queryDocs[0]);
    }
    return null;
  }

  async createClient(uid: string, client: ClientModel): Promise<ClientModel> {
    const remoteData = toClientRemote(client);
    await setDocument(clientsPath(uid), client.clientId, remoteData as unknown as Record<string, unknown>);
    return client;
  }

  async updateClient(uid: string, client: ClientModel): Promise<ClientModel> {
    const remoteData = toClientRemote(client);
    await updateDocument(clientsPath(uid), client.clientId, remoteData as unknown as Record<string, unknown>);
    return client;
  }

  async deleteClient(uid: string, clientId: string): Promise<string> {
    await deleteDocument(clientsPath(uid), clientId);
    return clientId;
  }
}
