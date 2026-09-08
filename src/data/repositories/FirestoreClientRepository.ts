import {
  getCollection,
  getDocument,
  setDocument,
  updateDocument,
  where,
  docRef,
  runFirestoreTransaction,
} from "@/data/datasources/firestore";
import { toClientDomain, toClientRemote } from "@/data/mappers/clientMapper";
import type { RemoteResultClientModel } from "@/data/remote/remoteClient";
import type { IClientRepository } from "@/domain/repositories/IClientRepository";
import type { ClientModel } from "@/domain/entities/client";

export class FirestoreClientRepository implements IClientRepository {
  private path(uid: string) {
    return `users/${uid}/clients`;
  }

  private configPath(uid: string) {
    return `users/${uid}/config`;
  }

  private numericId(id: string): number {
    return parseInt(String(id).replace(/\D/g, ""), 10) || 0;
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
    // La creación del cliente se mantiene igual
    await setDocument(this.path(uid), client.clientId, toClientRemote(client));
    
    const n = this.numericId(client.clientId);
    if (n > 0) {
      // Bloque transaccional para evitar pisar el contador si 2 usuarios crean clientes a la vez
      await runFirestoreTransaction(async (transaction) => {
        const counterReference = docRef(this.configPath(uid), "counters");
        const counterSnap = await transaction.get(counterReference);
        const currentLast = counterSnap.exists() ? (counterSnap.data().lastClientNumber ?? 0) : 0;
        
        if (n > currentLast) {
          transaction.set(counterReference, { lastClientNumber: n }, { merge: true });
        }
      });
    }
  }

  async updateClient(uid: string, clientId: string, data: Partial<ClientModel>): Promise<void> {
    const remoteData: Partial<RemoteResultClientModel> = {};
    if (data.clientName !== undefined) remoteData["Razón Social"] = data.clientName;
    if (data.isActive !== undefined) remoteData["Activo"] = data.isActive;
    await updateDocument(this.path(uid), clientId, remoteData);
  }

  async deleteClient(uid: string, clientId: string): Promise<void> {
    // Soft delete: preserva historial contable (facturas, pagos, pedidos), solo inhabilita.
    await updateDocument(this.path(uid), clientId, { "Activo": false });
  }

  async suggestNextClientId(uid: string): Promise<string> {
    const counters = await getDocument<{ lastClientNumber?: number }>(this.configPath(uid), "counters");
    let last = counters?.lastClientNumber ?? 0;
    if (last === 0) {
      // Escaneo de emergencia: mayor ID numérico en nombres de documento y campo "Cliente Id".
      const all = await getCollection<RemoteResultClientModel & { id: string }>(this.path(uid));
      for (const c of all) {
        last = Math.max(last, this.numericId(c.id), this.numericId(c["Cliente Id"] ?? ""));
      }
    }
    return String(last + 1);
  }
}
