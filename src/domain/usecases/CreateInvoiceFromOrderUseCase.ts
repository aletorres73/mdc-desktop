import type { BuyOrderModel } from "../entities/order";
import type { BillingModel } from "../entities/invoice";
import type { IInvoiceRepository } from "../repositories/IInvoiceRepository";
import type { PaymentCondition } from "../entities/factory";
import type { IFactoryRepository } from "../repositories/IFactoryRepository";
import { buyOrderToBilling, validateBuyOrderForBilling } from "@/data/mappers/invoiceFromOrderMapper";
import { recalculateBilling } from "../logic/recalculate";

/**
 * Caso de uso: Crear una factura a partir de un pedido de compra
 * 
 * Responsabilidades:
 * 1. Validar que el pedido tenga datos completos
 * 2. Convertir el pedido a factura
 * 3. Aplicar condición de pago y calcular vencimiento
 * 4. Guardar la factura
 * 5. Actualizar estado del pedido (opcional)
 */
export class CreateInvoiceFromOrderUseCase {
  constructor(
    private invoiceRepo: IInvoiceRepository,
    private factoryRepo: IFactoryRepository
  ) {}

  async execute(uid: string, buyOrder: BuyOrderModel): Promise<BillingModel> {
    // 1. Validar datos del pedido
    const validationError = validateBuyOrderForBilling(buyOrder);
    if (validationError) {
      throw new Error(`Validación fallida: ${validationError}`);
    }

    // 2. Convertir pedido a factura
    let billing = buyOrderToBilling(buyOrder);

    // 3. Obtener fábrica y aplicar condición de pago
    const factory = await this.factoryRepo.getFactoryByName(uid, buyOrder.factory);
    if (factory && buyOrder.paymentCondition) {
      const condition = factory.paymentType?.find(
        (pc: PaymentCondition) => pc.paymentName === buyOrder.paymentCondition
      );
      if (condition) {
        billing = recalculateBilling(billing, condition);
      }
    }

    // 4. Guardar factura
    const savedBilling = await this.invoiceRepo.createInvoice(uid, billing);

    return savedBilling;
  }
}
