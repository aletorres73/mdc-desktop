import type { IFactoryRepository } from "@/domain/repositories/IFactoryRepository";
import type { IInvoiceRepository } from "@/domain/repositories/IInvoiceRepository";
import type { CommissionConfig } from "@/domain/entities/factory";
import { calculateCommission } from "@/domain/logic/commissionCalculator";

export interface CommissionSummary {
  billingNumber: string;
  clientName: string;
  brand: string;
  total: number;
  commission: number;
}

export class CommissionUseCase {
  constructor(
    private factoryRepo: IFactoryRepository,
    private invoiceRepo: IInvoiceRepository,
  ) {}

  async getCommissionSummary(uid: string, config?: CommissionConfig): Promise<CommissionSummary[]> {
    const factories = await this.factoryRepo.getFactories(uid);
    const page = await this.invoiceRepo.getInvoicesPage(uid, {}, 500, null);
    return page.items.map((billing) => ({
      billingNumber: billing.billingNumber,
      clientName: billing.clientName,
      brand: billing.brand,
      total: billing.total,
      commission: calculateCommission(billing, factories, config),
    }));
  }
}
