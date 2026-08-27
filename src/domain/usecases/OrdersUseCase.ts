import type { IOrderRepository } from "../repositories/IOrderRepository";
import type { BuyOrderModel, OrderModel, OrderFilters } from "../entities/order";

export class OrdersUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async getOrders(uid: string, filters: OrderFilters): Promise<OrderModel[]> {
    const orders = await this.orderRepo.getOrders(uid, filters.factory);
    if (!filters.search || filters.search.trim() === "") {
      return orders;
    }
    const query = filters.search.toLowerCase().trim();
    return orders.filter(
      (o) =>
        o.nameClient.toLowerCase().includes(query) ||
        o.orderNumber.toLowerCase().includes(query) ||
        o.numberDocument.toLowerCase().includes(query)
    );
  }

  async getBuyOrders(uid: string, clientId: string): Promise<BuyOrderModel[]> {
    return this.orderRepo.getBuyOrders(uid, clientId);
  }

  async getBuyOrder(uid: string, clientId: string, orderId: string): Promise<BuyOrderModel | null> {
    return this.orderRepo.getBuyOrder(uid, clientId, orderId);
  }

  async createBuyOrder(uid: string, clientId: string, order: BuyOrderModel): Promise<string> {
    if (!order.client || !order.factory) {
      throw new Error("El cliente y la fábrica son requeridos");
    }
    return this.orderRepo.createBuyOrder(uid, clientId, order);
  }

  async getFactoryNames(uid: string): Promise<string[]> {
    return this.orderRepo.getFactoryNames(uid);
  }
}
