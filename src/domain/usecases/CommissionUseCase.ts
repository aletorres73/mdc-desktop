import type { IFactoryRepository } from "@/domain/repositories/IFactoryRepository";
import type { IInvoiceRepository } from "@/domain/repositories/IInvoiceRepository";
import type { IPaymentRegisterRepository } from "@/domain/repositories/IPaymentRegisterRepository";
import type { CommissionConfig } from "@/domain/entities/factory";
import { VIRTUAL_MOVEMENT_METHODS, type MovementStatus } from "@/domain/entities/paymentRegister";
import { calculatePaymentCommission } from "@/domain/logic/commissionCalculator";

export interface CommissionSummary {
  paymentId: number;
  paymentDate: number;
  billingNumber: string;
  clientName: string;
  brand: string;
  segment: string;
  documentType: string;
  paymentAmount: number;
  paymentStatus: MovementStatus;
  total: number;
  commission: number;
}

export interface CommissionFilters {
  startDate?: number;
  endDate?: number;
  brand?: string;
  segment?: string;
  documentType?: string;
}

export class CommissionUseCase {
  constructor(
    private factoryRepo: IFactoryRepository,
    private invoiceRepo: IInvoiceRepository,
    private paymentRepo: IPaymentRegisterRepository,
  ) {}

  async getCommissionSummary(
    uid: string,
    config?: CommissionConfig,
    filters: CommissionFilters = {},
  ): Promise<CommissionSummary[]> {
    const factories = await this.factoryRepo.getFactories(uid);
    const invoices = [];
    let cursor: string | null = null;
    let endReached = false;

    while (!endReached) {
      const page = await this.invoiceRepo.getInvoicesPage(uid, {}, 500, cursor);
      invoices.push(...page.items);
      endReached = page.endReached;
      cursor = page.nextCursor;
    }

    const invoicesByNumber = new Map(invoices.map((invoice) => [invoice.billingNumber, invoice]));
    const payments = await this.paymentRepo.getMovements(uid);

    return payments
      .filter((payment) => !payment.isVirtual && !VIRTUAL_MOVEMENT_METHODS.includes(payment.method))
      .map((payment) => {
        const billing = invoicesByNumber.get(payment.documentNumber);
        if (!billing) return null;

        const matchesDate = (filters.startDate === undefined || payment.date >= filters.startDate) &&
          (filters.endDate === undefined || payment.date <= filters.endDate);
        const brand = payment.branch || billing.brand;
        const matchesFilters = matchesDate &&
          (!filters.brand || brand === filters.brand) &&
          (!filters.segment || billing.branch === filters.segment) &&
          (!filters.documentType || billing.type === filters.documentType);
        if (!matchesFilters) return null;

        return {
          paymentId: payment.id,
          paymentDate: payment.date,
          billingNumber: billing.billingNumber,
          clientName: billing.clientName || payment.clientName,
          brand,
          segment: billing.branch,
          documentType: billing.type,
          paymentAmount: payment.total,
          paymentStatus: payment.status,
          total: billing.total,
          commission: calculatePaymentCommission(payment, billing, factories, config),
        };
      })
      .filter((summary): summary is CommissionSummary => summary !== null);
  }
}
