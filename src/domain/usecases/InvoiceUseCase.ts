import type { IInvoiceRepository } from "../repositories/IInvoiceRepository";
import type { BillingModel, InvoiceFilters, InvoicePageDomain } from "../entities/invoice";
import type { PaymentCondition } from "../entities/factory";
import { InvoiceFilterService } from "../logic/invoiceFilterService";
import {
  addInvoiceComment,
  applyInvoicePayment,
  recalculateBilling,
  updateInvoiceDetails,
  updateInvoicePayment,
  deleteInvoicePayment,
  reconcileInvoicePayment,
  type InvoicePaymentInput,
} from "../logic/recalculate";

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

  async updateInvoiceDetails(
    uid: string,
    billing: BillingModel,
    updates: Partial<BillingModel>
  ): Promise<BillingModel> {
    const updated = updateInvoiceDetails(billing, updates);
    await this.invoiceRepo.updateInvoice(uid, updated.billingNumber, updated);
    return updated;
  }

  async addInvoiceComment(
    uid: string,
    billing: BillingModel,
    comment: string
  ): Promise<BillingModel> {
    const updated = addInvoiceComment(billing, comment);
    await this.invoiceRepo.updateInvoice(uid, updated.billingNumber, updated);
    return updated;
  }

  async applyInvoicePayment(
    uid: string,
    billing: BillingModel,
    payment: InvoicePaymentInput
  ): Promise<BillingModel> {
    const updated = applyInvoicePayment(billing, payment);
    await this.invoiceRepo.updateInvoice(uid, updated.billingNumber, updated);
    return updated;
  }

  async updateInvoicePayment(
    uid: string,
    billing: BillingModel,
    paymentIndex: number,
    changes: Partial<InvoicePaymentInput & { amount: number; status: string; note?: string }>
  ): Promise<BillingModel> {
    const updated = updateInvoicePayment(billing, paymentIndex, changes);
    await this.invoiceRepo.updateInvoice(uid, updated.billingNumber, updated);
    return updated;
  }

  async deleteInvoicePayment(
    uid: string,
    billing: BillingModel,
    paymentIndex: number
  ): Promise<BillingModel> {
    const updated = deleteInvoicePayment(billing, paymentIndex);
    await this.invoiceRepo.updateInvoice(uid, updated.billingNumber, updated);
    return updated;
  }

  async reconcileInvoicePayment(
    uid: string,
    billing: BillingModel,
    paymentIndex: number
  ): Promise<BillingModel> {
    const updated = reconcileInvoicePayment(billing, paymentIndex);
    await this.invoiceRepo.updateInvoice(uid, updated.billingNumber, updated);
    return updated;
  }

  async changePaymentCondition(
    uid: string,
    billing: BillingModel,
    condition: PaymentCondition | null
  ): Promise<BillingModel> {
    const updated = updateInvoiceDetails(billing, {
      paymentCondition: condition?.paymentName ?? "",
    });
    const recalculated = recalculateBilling(updated, condition);
    await this.invoiceRepo.updateInvoice(uid, recalculated.billingNumber, recalculated);
    return recalculated;
  }

  async deleteInvoice(uid: string, billingNumber: string): Promise<void> {
    await this.invoiceRepo.deleteInvoice(uid, billingNumber);
  }
}
