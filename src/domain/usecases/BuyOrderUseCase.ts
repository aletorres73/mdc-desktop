import type { IBuyOrderRepository } from "@/domain/repositories/IBuyOrderRepository";
import type { BuyOrderModel } from "@/domain/entities/buyOrder";

export class BuyOrderUseCase {
  constructor(private buyOrderRepo: IBuyOrderRepository) {}

  getByClient(uid: string, clientId: string): Promise<BuyOrderModel[]> {
    return this.buyOrderRepo.getBuyOrdersByClient(uid, clientId);
  }

  getOrder(uid: string, clientId: string, orderId: string): Promise<BuyOrderModel | null> {
    return this.buyOrderRepo.getBuyOrder(uid, clientId, orderId);
  }

  async createOrder(uid: string, order: Omit<BuyOrderModel, "id">): Promise<BuyOrderModel> {
    const id = `order_${Date.now()}`;
    const full: BuyOrderModel = { ...order, id };
    await this.buyOrderRepo.createBuyOrder(uid, full);
    return full;
  }

  updateOrder(uid: string, order: BuyOrderModel): Promise<void> {
    return this.buyOrderRepo.updateBuyOrder(uid, order);
  }

  deleteOrder(uid: string, clientId: string, orderId: string): Promise<void> {
    return this.buyOrderRepo.deleteBuyOrder(uid, clientId, orderId);
  }

  calculateTotal(order: Pick<BuyOrderModel, "articles" | "discount">): number {
    const gross = order.articles.reduce((sum, a) => sum + (a.value ?? 0) * a.pairs, 0);
    return gross * (1 - (order.discount || 0) / 100);
  }
}
