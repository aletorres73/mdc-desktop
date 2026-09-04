import type { IInvoiceRepository } from "@/domain/repositories/IInvoiceRepository";
import type { IBuyOrderRepository } from "@/domain/repositories/IBuyOrderRepository";
import type { IFactoryRepository } from "@/domain/repositories/IFactoryRepository";
import { buyOrderToBilling, validateBuyOrderForBilling } from "@/data/mappers/invoiceFromOrderMapper";
import { recalculateBilling } from "@/domain/logic/recalculate";

export class CreateInvoiceFromOrderUseCase {
  constructor(
    private invoiceRepo: IInvoiceRepository,
    private buyOrderRepo: IBuyOrderRepository,
    private factoryRepo: IFactoryRepository,
  ) {}

  async execute(uid: string, clientId: string, orderId: string, billingNumber: string): Promise<string> {
    const order = await this.buyOrderRepo.getBuyOrder(uid, clientId, orderId);
    if (!order) throw new Error("Pedido no encontrado");

    const validationError = validateBuyOrderForBilling(order);
    if (validationError) throw new Error(validationError);

    const billing = buyOrderToBilling(order, billingNumber);
    const factory = (await this.factoryRepo.getFactoryByName(uid, billing.brand)) ?? undefined;
    return this.invoiceRepo.createInvoice(uid, recalculateBilling(billing, factory));
  }
}
