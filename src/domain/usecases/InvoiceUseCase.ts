import type { IInvoiceRepository, InvoiceFilters } from "@/domain/repositories/IInvoiceRepository";
import type { IFactoryRepository } from "@/domain/repositories/IFactoryRepository";
import type { IPaymentRegisterRepository } from "@/domain/repositories/IPaymentRegisterRepository";
import type { BillingModel, BillingComments, InvoicePage } from "@/domain/entities/billing";
import type { MovementMethod } from "@/domain/entities/paymentRegister";
import { recalculateBilling } from "@/domain/logic/recalculate";
import { VIRTUAL_MOVEMENT_METHODS } from "@/domain/entities/paymentRegister";

export class InvoiceUseCase {
  constructor(
    private invoiceRepo: IInvoiceRepository,
    private factoryRepo: IFactoryRepository,
    private paymentRepo: IPaymentRegisterRepository,
  ) {}

  getInvoicesPage(uid: string, filters: InvoiceFilters, pageSize: number, cursor?: string | null): Promise<InvoicePage> {
    return this.invoiceRepo.getInvoicesPage(uid, filters, pageSize, cursor);
  }

  getInvoice(uid: string, id: string): Promise<BillingModel | null> {
    return this.invoiceRepo.getInvoice(uid, id);
  }

  async createInvoice(uid: string, billing: BillingModel): Promise<string> {
    const factory = (await this.factoryRepo.getFactoryByName(uid, billing.brand)) ?? undefined;
    const recalculated = recalculateBilling(billing, factory);
    return this.invoiceRepo.createInvoice(uid, recalculated);
  }

  async deleteInvoice(uid: string, id: string): Promise<void> {
    await this.invoiceRepo.deleteInvoice(uid, id);
  }

  async addComment(uid: string, id: string, comment: string): Promise<void> {
    const invoice = await this.invoiceRepo.getInvoice(uid, id);
    if (!invoice) throw new Error("Invoice not found");
    const comments: BillingComments[] = [...invoice.comments, { comments: comment, date: Date.now() }];
    await this.invoiceRepo.updateInvoice(uid, id, { comments });
  }

  async changePaymentCondition(uid: string, id: string, paymentCondition: string): Promise<void> {
    const invoice = await this.invoiceRepo.getInvoice(uid, id);
    if (!invoice) throw new Error("Invoice not found");
    const factory = (await this.factoryRepo.getFactoryByName(uid, invoice.brand)) ?? undefined;
    const recalculated = recalculateBilling({ ...invoice, paymentCondition }, factory);
    await this.invoiceRepo.updateInvoice(uid, id, recalculated);
  }

  /**
   * Registra pago (real o virtual) y sincroniza el total 'payed' de la factura
   * sumando todos los movimientos vigentes en paymentRegister.
   */
  async applyInvoicePayment(
    uid: string,
    invoiceId: string,
    payment: { amount: number; method: MovementMethod; notes: string },
  ): Promise<void> {
    const invoice = await this.invoiceRepo.getInvoice(uid, invoiceId);
    if (!invoice) throw new Error("Invoice not found");

    const isVirtual = VIRTUAL_MOVEMENT_METHODS.includes(payment.method);
    const nextId = await this.paymentRepo.getNextId(uid);
    await this.paymentRepo.createMovement(uid, {
      id: nextId,
      clientId: invoice.clientId,
      branch: invoice.brand,
      date: Date.now(),
      clientName: invoice.clientName,
      documentNumber: invoice.billingNumber,
      type: invoice.type,
      total: payment.amount,
      notes: payment.notes,
      method: payment.method,
      status: "PENDIENTE",
      reconciliationDate: 0,
      confirmationTimestamp: Date.now(),
      isVirtual,
    });

    const movements = await this.paymentRepo.getMovements(uid, { clientId: invoice.clientId });
    const relevant = movements.filter((m) => m.documentNumber === invoice.billingNumber);
    const payed = relevant.filter((m) => !m.isVirtual).reduce((sum, m) => sum + m.total, 0);
    const virtualReduction = relevant.filter((m) => m.isVirtual).reduce((sum, m) => sum + m.total, 0);

    const factory = (await this.factoryRepo.getFactoryByName(uid, invoice.brand)) ?? undefined;
    const recalculated = recalculateBilling(
      { ...invoice, payed, toPay: invoice.total - virtualReduction },
      factory,
    );
    await this.invoiceRepo.updateInvoice(uid, invoiceId, recalculated);
  }

  async deleteInvoicePayment(uid: string, invoiceId: string, movementId: number): Promise<void> {
    await this.paymentRepo.deleteMovement(uid, movementId);
    const invoice = await this.invoiceRepo.getInvoice(uid, invoiceId);
    if (!invoice) return;
    const movements = await this.paymentRepo.getMovements(uid, { clientId: invoice.clientId });
    const relevant = movements.filter((m) => m.documentNumber === invoice.billingNumber);
    const payed = relevant.filter((m) => !m.isVirtual).reduce((sum, m) => sum + m.total, 0);
    const factory = (await this.factoryRepo.getFactoryByName(uid, invoice.brand)) ?? undefined;
    await this.invoiceRepo.updateInvoice(uid, invoiceId, recalculateBilling({ ...invoice, payed }, factory));
  }

  async reconcileInvoicePayment(uid: string, movementId: number): Promise<void> {
    await this.paymentRepo.updateMovement(uid, movementId, {
      status: "IMPUTADO",
      reconciliationDate: Date.now(),
    });
  }
}
