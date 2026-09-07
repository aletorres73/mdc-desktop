import type { BuyOrderModel } from "@/domain/entities/buyOrder";

export interface IBuyOrderRepository {
  getBuyOrdersByClient(uid: string, clientId: string): Promise<BuyOrderModel[]>;
  getAllBuyOrders(uid: string): Promise<BuyOrderModel[]>;
  getBuyOrder(uid: string, clientId: string, orderId: string): Promise<BuyOrderModel | null>;
  createBuyOrder(uid: string, order: BuyOrderModel): Promise<void>;
  updateBuyOrder(uid: string, order: BuyOrderModel): Promise<void>;
  deleteBuyOrder(uid: string, clientId: string, orderId: string): Promise<void>;
  nextOrderNumber(uid: string): Promise<number>;
}
