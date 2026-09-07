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
    const normalizedNumber = billingNumber.trim();
    if (!normalizedNumber) throw new Error("Ingresá un número de factura");

    const order = await this.buyOrderRepo.getBuyOrder(uid, clientId, orderId);
    if (!order) throw new Error("Pedido no encontrado");

    const validationError = validateBuyOrderForBilling(order);
    if (validationError) throw new Error(validationError);

    const billing = buyOrderToBilling(order, normalizedNumber);
    const duplicate = await this.invoiceRepo.getInvoiceByBillingNumber(uid, normalizedNumber);
    if (duplicate) {
      throw new Error("El número de factura ya existe en la base de datos. No se puede pisar un documento existente.");
    }

    const factory = (await this.factoryRepo.getFactoryByName(uid, billing.brand)) ?? undefined;
    const recalculated = recalculateBilling(billing, factory);
    return this.invoiceRepo.createInvoice(uid, recalculated);
  }
}
