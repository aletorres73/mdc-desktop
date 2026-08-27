import type { IOrderRepository } from "@/domain/repositories/IOrderRepository";
import type { BuyOrderModel, OrderModel } from "@/domain/entities/order";
import { getCollection, getDocument, addDocument } from "../datasources";
import type { RemoteResultBuyOrder, RemoteResultOrder } from "../remote/remoteResultOrder";
import type { RemoteResultFactoryModel } from "../remote/remoteResultFactory";
import { toBuyOrderDomain, toBuyOrderRemote, toOrderDomain } from "../mappers/orderMapper";

function ordersPath(uid: string): string {
  return `users/${uid}/Orders`;
}

function buyOrdersPath(uid: string, clientId: string): string {
  return `users/${uid}/clients/${clientId}/buyOrders`;
}

function factoriesPath(uid: string): string {
  return `users/${uid}/factories`;
}

export class FirestoreOrderRepository implements IOrderRepository {
  async getOrders(uid: string, factoryFilter?: string): Promise<OrderModel[]> {
    const filters: Array<{ field: string; op: "=" | "=="; value: unknown }> = [];
    if (factoryFilter && factoryFilter !== "all") {
      filters.push({ field: "Marca", op: "=", value: factoryFilter });
    }

    const docs = await getCollection<RemoteResultOrder>(ordersPath(uid), {
      filters: filters.length > 0 ? filters : undefined,
      orderBy: { field: "Fecha de carga", direction: "desc" },
    });

    return docs.map(toOrderDomain);
  }

  async getBuyOrders(uid: string, clientId: string): Promise<BuyOrderModel[]> {
    const docs = await getCollection<RemoteResultBuyOrder>(buyOrdersPath(uid, clientId), {
      orderBy: { field: "Fecha de carga", direction: "desc" },
    });
    return docs.map(toBuyOrderDomain);
  }

  async getBuyOrder(uid: string, clientId: string, orderId: string): Promise<BuyOrderModel | null> {
    const directDoc = await getDocument<RemoteResultBuyOrder>(buyOrdersPath(uid, clientId), orderId);
    if (directDoc) {
      return toBuyOrderDomain(directDoc);
    }
    const queryDocs = await getCollection<RemoteResultBuyOrder>(buyOrdersPath(uid, clientId), {
      filters: [{ field: "Pedido Id", op: "=", value: orderId }],
      limit: 1,
    });
    if (queryDocs.length > 0) {
      return toBuyOrderDomain(queryDocs[0]);
    }
    return null;
  }

  async createBuyOrder(uid: string, clientId: string, order: BuyOrderModel): Promise<string> {
    const remoteData = toBuyOrderRemote(order);
    const docId = await addDocument(buyOrdersPath(uid, clientId), remoteData as unknown as Record<string, unknown>);
    return docId;
  }

  async getFactoryNames(uid: string): Promise<string[]> {
    const docs = await getCollection<RemoteResultFactoryModel>(factoriesPath(uid));
    const names = docs.map((d) => d.Fabrica).filter(Boolean);
    return Array.from(new Set(names)).sort();
  }
}
