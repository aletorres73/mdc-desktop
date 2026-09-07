import type { IInvoiceRepository, InvoiceFilters } from "@/domain/repositories/IInvoiceRepository";
import type { IFactoryRepository } from "@/domain/repositories/IFactoryRepository";
import type { IPaymentRegisterRepository } from "@/domain/repositories/IPaymentRegisterRepository";
import type { BillingModel, BillingComments, InvoicePage } from "@/domain/entities/billing";
import type { MovementMethod, PaymentRegisterModel } from "@/domain/entities/paymentRegister";
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

  getInvoiceByBillingNumber(uid: string, billingNumber: string): Promise<BillingModel | null> {
    return this.invoiceRepo.getInvoiceByBillingNumber(uid, billingNumber);
  }

  getAllInvoices(uid: string): Promise<BillingModel[]> {
    return this.invoiceRepo.getAllInvoices(uid);
  }

  getInvoicesByOrder(uid: string, orderIds: string[]): Promise<BillingModel[]> {
    return this.invoiceRepo.getInvoicesByOrder(uid, orderIds);
  }

  async createInvoice(uid: string, billing: BillingModel): Promise<string> {
    const normalizedNumber = billing.billingNumber.trim();
    if (!normalizedNumber) throw new Error("Ingresá un número de factura");
    if (!billing.clientId || !billing.clientName.trim()) throw new Error("Seleccioná un cliente");
    if (!billing.brand.trim()) throw new Error("Seleccioná una fábrica");
    if (!Number.isFinite(billing.total) || billing.total <= 0) throw new Error("El total debe ser mayor a 0");

    const factory = (await this.factoryRepo.getFactoryByName(uid, billing.brand)) ?? undefined;
    if (!factory) throw new Error("La fábrica seleccionada no existe");
    if (factory.branchList.length > 0 && !billing.branch.trim()) {
      throw new Error("Seleccioná un segmento para la fábrica");
    }

    const existing = await this.invoiceRepo.getInvoiceByBillingNumber(uid, normalizedNumber);
    if (existing && (!billing.id || existing.id !== billing.id)) {
      throw new Error("El número de factura ya existe en la base de datos. No se puede pisar un documento existente.");
    }

    const recalculated = recalculateBilling(billing, factory);
    return this.invoiceRepo.createInvoice(uid, recalculated);
  }

  async updateInvoice(uid: string, id: string, data: Partial<BillingModel>): Promise<void> {
    const current = await this.invoiceRepo.getInvoice(uid, id);
    if (!current) throw new Error("Factura no encontrada");

    const next = { ...current, ...data, id };
    const normalizedNumber = next.billingNumber.trim();
    if (!normalizedNumber) throw new Error("Ingresá un número de factura");
    if (!next.clientId || !next.clientName.trim()) throw new Error("Seleccioná un cliente");
    if (!next.brand.trim()) throw new Error("Seleccioná una fábrica");

    const factory = (await this.factoryRepo.getFactoryByName(uid, next.brand)) ?? undefined;
    if (!factory) throw new Error("La fábrica seleccionada no existe");
    if (factory.branchList.length > 0 && !next.branch.trim()) {
      throw new Error("Seleccioná un segmento para la fábrica");
    }

    const duplicate = await this.invoiceRepo.getInvoiceByBillingNumber(uid, normalizedNumber);
    if (duplicate && duplicate.id !== id) {
      throw new Error("El número de factura ya existe en la base de datos. Elegí otro número.");
    }

    await this.invoiceRepo.updateInvoice(uid, id, recalculateBilling(next, factory));
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
    const fallbackCondition = factory?.paymentType[0]?.paymentName ?? invoice.paymentCondition;
    const validCondition = factory?.paymentType.some((condition) => condition.paymentName === paymentCondition)
      ? paymentCondition
      : fallbackCondition;
    const recalculated = recalculateBilling({ ...invoice, paymentCondition: validCondition }, factory);
    await this.invoiceRepo.updateInvoice(uid, id, recalculated);
  }

  /**
   * Registra pago (real o virtual) y sincroniza el total 'payed' de la factura
   * sumando todos los movimientos vigentes en paymentRegister.
   */
  async applyInvoicePayment(
    uid: string,
    invoiceId: string,
    payment: { amount: number; method: MovementMethod; notes: string; date: number },
  ): Promise<void> {
    const invoice = await this.invoiceRepo.getInvoice(uid, invoiceId);
    if (!invoice) throw new Error("Invoice not found");

    const isVirtual = VIRTUAL_MOVEMENT_METHODS.includes(payment.method);
    if (!Number.isFinite(payment.amount) || payment.amount <= 0) {
      throw new Error("El monto debe ser mayor a cero");
    }
    if (!Number.isFinite(payment.date) || payment.date > Date.now()) {
      throw new Error("La fecha de pago no puede ser futura");
    }
    if (invoice.rest <= 0) {
      throw new Error("La factura ya está completamente cobrada");
    }
    const maximum = isVirtual ? invoice.toPay : invoice.rest;
    if (payment.amount > maximum) {
      throw new Error("El monto supera el saldo pendiente de la factura");
    }
    const nextId = await this.paymentRepo.getNextId(uid);
    await this.paymentRepo.createMovement(uid, {
      id: nextId,
      clientId: invoice.clientId,
      branch: invoice.brand,
      date: payment.date,
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

    await this.recalculateInvoiceFromMovements(uid, invoiceId, invoice);
  }

  async updateInvoicePayment(
    uid: string,
    invoiceId: string,
    movementId: number,
    payment: { amount: number; method: MovementMethod; notes: string; date: number },
  ): Promise<void> {
    const invoice = await this.invoiceRepo.getInvoice(uid, invoiceId);
    if (!invoice) throw new Error("Invoice not found");

    const movements = await this.paymentRepo.getMovements(uid, { clientId: invoice.clientId });
    const current = movements.find((movement) => movement.id === movementId && movement.documentNumber === invoice.billingNumber);
    if (!current) throw new Error("Pago no encontrado");

    const isVirtual = VIRTUAL_MOVEMENT_METHODS.includes(payment.method);
    if (!Number.isFinite(payment.amount) || payment.amount <= 0) {
      throw new Error("El monto debe ser mayor a cero");
    }
    if (!Number.isFinite(payment.date) || payment.date > Date.now()) {
      throw new Error("La fecha de pago no puede ser futura");
    }

    const currentIsVirtual = current.isVirtual || VIRTUAL_MOVEMENT_METHODS.includes(current.method);
    const available = isVirtual
      ? invoice.toPay + (currentIsVirtual ? current.total : 0)
      : invoice.rest + (currentIsVirtual ? 0 : current.total);
    if (payment.amount > available) {
      throw new Error("El monto supera el saldo pendiente de la factura");
    }

    await this.paymentRepo.updateMovement(uid, movementId, {
      total: payment.amount,
      method: payment.method,
      notes: payment.notes,
      date: payment.date,
      isVirtual,
    });
    await this.recalculateInvoiceFromMovements(uid, invoiceId, invoice);
  }

  async deleteInvoicePayment(uid: string, invoiceId: string, movementId: number): Promise<void> {
    await this.paymentRepo.deleteMovement(uid, movementId);
    const invoice = await this.invoiceRepo.getInvoice(uid, invoiceId);
    if (!invoice) return;
    await this.recalculateInvoiceFromMovements(uid, invoiceId, invoice);
  }

  async reconcileInvoicePayment(uid: string, movementId: number): Promise<void> {
    await this.paymentRepo.updateMovement(uid, movementId, {
      status: "RECONCILIADO",
      reconciliationDate: Date.now(),
    });
  }

  private async recalculateInvoiceFromMovements(uid: string, invoiceId: string, invoice: BillingModel): Promise<void> {
    const movements = await this.paymentRepo.getMovements(uid, { clientId: invoice.clientId });
    const relevant = movements.filter((movement) => movement.documentNumber === invoice.billingNumber);
    const payed = relevant.filter((movement) => !movement.isVirtual).reduce((sum, movement) => sum + movement.total, 0);
    const virtualReduction = relevant.filter((movement) => movement.isVirtual).reduce((sum, movement) => sum + movement.total, 0);
    const factory = (await this.factoryRepo.getFactoryByName(uid, invoice.brand)) ?? undefined;
    await this.invoiceRepo.updateInvoice(
      uid,
      invoiceId,
      recalculateBilling({ ...invoice, payed, toPay: invoice.total - virtualReduction }, factory),
    );
  }
}
