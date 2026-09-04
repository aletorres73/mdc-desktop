import { getCollection, getDocument, setDocument, deleteDocument } from "@/data/datasources/firestore";
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
}
