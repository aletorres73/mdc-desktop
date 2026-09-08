import { getCollection, getCollectionGroup, getDocument, setDocument, deleteDocument, runFirestoreTransaction, docRef, where } from "@/data/datasources/firestore";
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
    try {
      // Consulta atómica: Trae todas las órdenes de toda la base de datos 
      // estrictamente filtradas por el propietario. (1 sola petición a Firebase)
      const remote = await getCollectionGroup<RemoteResultBuyOrder>("buyOrders", [
        where("uid", "==", uid)
      ]);
      return remote.map(toBuyOrderDomain);
    } catch (error) {
      console.error("Error al obtener pedidos globales.", error);
      return []; 
    }
  }

  async getBuyOrder(uid: string, clientId: string, orderId: string): Promise<BuyOrderModel | null> {
    const remote = await getDocument<RemoteResultBuyOrder>(this.path(uid, clientId), orderId);
    return remote ? toBuyOrderDomain(remote) : null;
  }

  async createBuyOrder(uid: string, order: BuyOrderModel): Promise<void> {
    // Inyectamos el 'uid' en el documento remoto para permitir el collectionGroup
    const remoteData = { ...toBuyOrderRemote(order), uid };
    await setDocument(this.path(uid, order.clientId), order.id, remoteData);
  }

  async updateBuyOrder(uid: string, order: BuyOrderModel): Promise<void> {
    const remoteData = { ...toBuyOrderRemote(order), uid };
    await setDocument(this.path(uid, order.clientId), order.id, remoteData);
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
