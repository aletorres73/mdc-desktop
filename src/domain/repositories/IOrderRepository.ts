import type { OrderModel } from "@/domain/entities/order";

export interface IOrderRepository {
  getOrders(uid: string): Promise<OrderModel[]>;
  createOrder(uid: string, order: OrderModel): Promise<void>;
  updateOrder(uid: string, orderNumber: string, data: Partial<OrderModel>): Promise<void>;
  deleteOrder(uid: string, orderNumber: string): Promise<void>;
}
