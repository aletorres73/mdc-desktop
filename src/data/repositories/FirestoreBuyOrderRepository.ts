import { getCollection, getCollectionGroup, getDocument, setDocument, deleteDocument } from "@/data/datasources/firestore";
import { toBuyOrderDomain, toBuyOrderRemote } from "@/data/mappers/buyOrderMapper";
import type { RemoteResultBuyOrder } from "@/data/remote/remoteBuyOrder";
import type { IBuyOrderRepository } from "@/domain/repositories/IBuyOrderRepository";
import type { BuyOrderModel } from "@/domain/entities/buyOrder";

export class FirestoreBuyOrderRepository implements IBuyOrderRepository {
  private path(uid: string, clientId: string) {
    return `users/${uid}/clients/${clientId}/buyOrders`;
  }

  async getBuyOrdersByClient(uid: string, clientId: string): Promise<BuyOrderModel[]> {
    const remote = await getCollection<RemoteResultBuyOrder>(this.path(uid, clientId));
    return remote.map(toBuyOrderDomain);
  }

  async getBuyOrder(uid: string, clientId: string, orderId: string): Promise<BuyOrderModel | null> {
    const remote = await getDocument<RemoteResultBuyOrder>(this.path(uid, clientId), orderId);
    return remote ? toBuyOrderDomain(remote) : null;
  }

  async createBuyOrder(uid: string, order: BuyOrderModel): Promise<void> {
    await setDocument(this.path(uid, order.clientId), order.id, toBuyOrderRemote(order));
  }

  async updateBuyOrder(uid: string, order: BuyOrderModel): Promise<void> {
    await setDocument(this.path(uid, order.clientId), order.id, toBuyOrderRemote(order));
  }

  async deleteBuyOrder(uid: string, clientId: string, orderId: string): Promise<void> {
    await deleteDocument(this.path(uid, clientId), orderId);
  }

  async nextOrderNumber(uid: string): Promise<number> {
    const configPath = `users/${uid}/config`;
    const counters = await getDocument<{ lastOrderNumber?: number }>(configPath, "counters");
    let last = counters?.lastOrderNumber ?? 0;
    if (last === 0) {
      // Escaneo de emergencia: buscar el "Orden Id" numérico más alto en todos los pedidos.
      // Puede fallar por reglas de seguridad en collectionGroup; en ese caso se arranca en 1.
      try {
        const all = await getCollectionGroup<RemoteResultBuyOrder>("buyOrders");
        for (const remote of all) {
          const n = parseInt(String(remote["Orden Id"] ?? "").replace(/\D/g, ""), 10) || 0;
          if (n > last) last = n;
        }
      } catch {
        // Sin permisos para el escaneo global: se usa el contador local.
      }
    }
    const next = last + 1;
    await setDocument(configPath, "counters", { lastOrderNumber: next });
    return next;
  }
}
