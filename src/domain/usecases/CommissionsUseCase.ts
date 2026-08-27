import type { IInvoiceRepository } from "../repositories/IInvoiceRepository";
import type { IFactoryRepository } from "../repositories/IFactoryRepository";
import { CommissionCalculator, type FactoryCommissionSummary } from "../logic/commissionCalculator";

export class CommissionsUseCase {
  constructor(
    private invoiceRepo: IInvoiceRepository,
    private factoryRepo: IFactoryRepository
  ) {}

  async getCommissionsSummary(uid: string): Promise<FactoryCommissionSummary[]> {
    const [billings, factories] = await Promise.all([
      this.invoiceRepo.getAllBillings(uid),
      this.factoryRepo.getAllFactories(uid),
    ]);

    return CommissionCalculator.calculateCommissionsFromBillings(billings, factories);
  }
}
