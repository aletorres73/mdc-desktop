import {
  getCollection,
  getCollectionGroup,
  getDocument,
  setDocument,
  updateDocument,
  deleteDocument,
  where,
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
    await setDocument(this.path(uid), client.clientId, toClientRemote(client));
    // Mantener el contador por encima del ID más alto creado.
    const n = this.numericId(client.clientId);
    if (n > 0) {
      const counters = await getDocument<{ lastClientNumber?: number }>(this.configPath(uid), "counters");
      if (n > (counters?.lastClientNumber ?? 0)) {
        await setDocument(this.configPath(uid), "counters", { lastClientNumber: n });
      }
    }
  }

  async updateClient(uid: string, clientId: string, data: Partial<ClientModel>): Promise<void> {
    await updateDocument(this.path(uid), clientId, data);
  }

  async deleteClient(uid: string, clientId: string): Promise<void> {
    const clientOrdersPath = `users/${uid}/clients/${clientId}/buyOrders`;
    const clientOrders = await getCollection(clientOrdersPath);
    for (const order of clientOrders) {
      await deleteDocument(clientOrdersPath, order.id);
    }

    const billingPath = `users/${uid}/allBillings`;
    const billings = await getCollection<{ id: string }>(billingPath, [where("Cliente Id", "==", clientId)]);
    for (const billing of billings) {
      await deleteDocument(billingPath, billing.id);
    }

    const paymentPath = `users/${uid}/paymentRegister`;
    const payments = await getCollection<{ id: string }>(paymentPath, [where("Cliente ID", "==", clientId)]);
    for (const payment of payments) {
      await deleteDocument(paymentPath, payment.id);
    }

    await deleteDocument(this.path(uid), clientId);

    const hasRemainingOrders = await this.hasAnyOrderForUser(uid);
    if (!hasRemainingOrders) {
      await setDocument(this.configPath(uid), "counters", { lastOrderNumber: 0 });
    }

    // Regla de borrado: si se elimina el ID más alto, el contador retrocede para reutilizar el espacio.
    const n = this.numericId(clientId);
    if (n > 0) {
      const counters = await getDocument<{ lastClientNumber?: number }>(this.configPath(uid), "counters");
      if (counters && n === (counters.lastClientNumber ?? 0)) {
        await setDocument(this.configPath(uid), "counters", { lastClientNumber: n - 1 });
      }
    }
  }

  private async hasAnyOrderForUser(uid: string): Promise<boolean> {
    try {
      const all = await getCollectionGroup<{ __path?: string }>("buyOrders");
      return all.some((order) => order.__path?.startsWith(`users/${uid}/`));
    } catch {
      return true;
    }
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
