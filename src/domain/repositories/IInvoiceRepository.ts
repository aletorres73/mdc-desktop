import type { BillingModel, InvoicePage } from "@/domain/entities/billing";

export interface InvoiceFilters {
  clientId?: string;
  clientNamePrefix?: string;
  searchText?: string;
  brand?: string;
  state?: string;
}

export interface IInvoiceRepository {
  getInvoicesPage(
    uid: string,
    filters: InvoiceFilters,
    pageSize: number,
    cursor?: string | null,
  ): Promise<InvoicePage>;
  getInvoice(uid: string, id: string): Promise<BillingModel | null>;
  getInvoiceByBillingNumber(uid: string, billingNumber: string): Promise<BillingModel | null>;
  getAllInvoices(uid: string): Promise<BillingModel[]>;
  /** Facturas/remitos asociados a uno o más pedidos (campo remoto "Orden"). */
  getInvoicesByOrder(uid: string, orderIds: string[]): Promise<BillingModel[]>;
  createInvoice(uid: string, billing: BillingModel): Promise<string>;
  updateInvoice(uid: string, id: string, data: Partial<BillingModel>): Promise<void>;
  deleteInvoice(uid: string, id: string): Promise<void>;
  getPendingInvoicesForAgenda(uid: string): Promise<BillingModel[]>;
}
