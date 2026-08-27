import type { BuyOrderModel, OrderModel } from "../entities/order";

export interface IOrderRepository {
  getOrders(uid: string, factoryFilter?: string): Promise<OrderModel[]>;
  getBuyOrders(uid: string, clientId: string): Promise<BuyOrderModel[]>;
  getBuyOrder(uid: string, clientId: string, orderId: string): Promise<BuyOrderModel | null>;
  createBuyOrder(uid: string, clientId: string, order: BuyOrderModel): Promise<string>;
  getFactoryNames(uid: string): Promise<string[]>;
}
