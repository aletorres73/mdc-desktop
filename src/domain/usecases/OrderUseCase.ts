import type { IOrderRepository } from "@/domain/repositories/IOrderRepository";
import type { OrderModel } from "@/domain/entities/order";

export class OrderUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  getOrders(uid: string): Promise<OrderModel[]> {
    return this.orderRepo.getOrders(uid);
  }

  createOrder(uid: string, order: OrderModel): Promise<void> {
    return this.orderRepo.createOrder(uid, order);
  }

  updateOrder(uid: string, orderNumber: string, data: Partial<OrderModel>): Promise<void> {
    return this.orderRepo.updateOrder(uid, orderNumber, data);
  }

  deleteOrder(uid: string, orderNumber: string): Promise<void> {
    return this.orderRepo.deleteOrder(uid, orderNumber);
  }
}
