import { getCollection, getCollectionGroup, getDocument, setDocument, deleteDocument, runFirestoreTransaction, docRef } from "@/data/datasources/firestore";
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

  async getAllBuyOrders(uid: string): Promise<BuyOrderModel[]> {
    // Las reglas de seguridad suelen bloquear collectionGroup entre usuarios;
    // si falla, se hace fan-out por cliente (una consulta por cliente).
    try {
      const remote = await getCollectionGroup<RemoteResultBuyOrder & { __path?: string }>("buyOrders");
      return remote
        .filter((order) => order.__path?.startsWith(`users/${uid}/`))
        .map(toBuyOrderDomain);
    } catch {
      const clients = await getCollection<{ id: string }>(`users/${uid}/clients`);
      const perClient = await Promise.all(
        clients.map((client) =>
          getCollection<RemoteResultBuyOrder>(this.path(uid, client.id)).catch(
            () => [] as RemoteResultBuyOrder[],
          ),
        ),
      );
      return perClient.flat().map(toBuyOrderDomain);
    }
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
    // 1. Escaneo preventivo fuera de la transacción (por si el contador no existe aún)
    const counters = await getDocument<{ lastOrderNumber?: number }>(configPath, "counters");
    let initialScanLast = 0;
    if (!counters || (counters.lastOrderNumber ?? 0) === 0) {
      try {
        const all = await getCollectionGroup<RemoteResultBuyOrder>("buyOrders");
        for (const remote of all) {
          const n = parseInt(String(remote["Orden Id"] ?? "").replace(/\D/g, ""), 10) || 0;
          if (n > initialScanLast) initialScanLast = n;
        }
      } catch {
        // Sin permisos para el escaneo global: se usa el contador local.
      }
    }

    // 2. Transacción atómica para obtener e incrementar el ID
    return runFirestoreTransaction(async (transaction) => {
      const counterReference = docRef(configPath, "counters");
      const counterSnap = await transaction.get(counterReference);      
      let currentLast = counterSnap.exists() ? (counterSnap.data().lastOrderNumber ?? 0) : 0;
      // Si el contador está vacío, usamos el valor del escaneo previo
      if (currentLast === 0 && initialScanLast > 0) {
        currentLast = initialScanLast;
      }
      const next = currentLast + 1;
      // Utilizamos merge para no sobreescribir el contador de clientes si están en el mismo documento
      transaction.set(counterReference, { lastOrderNumber: next }, { merge: true });
      
      return next;
    });
  }
}
