import type { IInvoiceRepository } from "../repositories/IInvoiceRepository";
import type { BillingModel, InvoiceFilters, InvoicePageDomain } from "../entities/invoice";
import type { PaymentCondition } from "../entities/factory";
import { InvoiceFilterService } from "../logic/invoiceFilterService";
import { recalculateBilling } from "../logic/recalculate";

export class InvoiceUseCase {
  constructor(
    private invoiceRepo: IInvoiceRepository
  ) {}

  async getPaginatedInvoices(
    uid: string,
    filters: InvoiceFilters,
    startAfter?: unknown,
    pageSize: number = 20
  ): Promise<InvoicePageDomain> {
    const rawFilters = InvoiceFilterService.buildFilters(filters);
    const orderConfig = InvoiceFilterService.determineOrderBy(filters);

    return this.invoiceRepo.fetchPage(uid, {
      filters: rawFilters,
      orderByField: orderConfig.field,
      direction: orderConfig.direction,
      pageSize,
      startAfter,
    });
  }

  async getInvoiceByNumber(uid: string, invoiceNumber: string): Promise<BillingModel | null> {
    return this.invoiceRepo.getInvoiceByNumber(uid, invoiceNumber);
  }

  async getAllBillings(uid: string): Promise<BillingModel[]> {
    return this.invoiceRepo.getAllBillings(uid);
  }

  async recalculateAndSaveInvoice(
    uid: string,
    billing: BillingModel,
    condition?: PaymentCondition | null
  ): Promise<BillingModel> {
    const updated = recalculateBilling(billing, condition);
    await this.invoiceRepo.updateInvoice(uid, updated.billingNumber, updated);
    return updated;
  }
}
