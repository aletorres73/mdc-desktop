import { getCollection, setDocument, updateDocument, deleteDocument } from "@/data/datasources/firestore";
import { toOrderDomain, toOrderRemote } from "@/data/mappers/orderMapper";
import type { RemoteResultOrder } from "@/data/remote/remoteOrder";
import type { IOrderRepository } from "@/domain/repositories/IOrderRepository";
import type { OrderModel } from "@/domain/entities/order";

export class FirestoreOrderRepository implements IOrderRepository {
  private path(uid: string) {
    return `users/${uid}/Orders`;
  }

  async getOrders(uid: string): Promise<OrderModel[]> {
    const remote = await getCollection<RemoteResultOrder>(this.path(uid));
    return remote.map(toOrderDomain);
  }

  async createOrder(uid: string, order: OrderModel): Promise<void> {
    await setDocument(this.path(uid), order.orderNumber, toOrderRemote(order));
  }

  async updateOrder(uid: string, orderNumber: string, data: Partial<OrderModel>): Promise<void> {
    await updateDocument(this.path(uid), orderNumber, data);
  }

  async deleteOrder(uid: string, orderNumber: string): Promise<void> {
    await deleteDocument(this.path(uid), orderNumber);
  }
}
