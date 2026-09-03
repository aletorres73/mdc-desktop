import type { BillingModel, InvoicePageDomain } from "../entities/invoice";

export interface FetchInvoiceOptions {
  filters?: Array<{ field: string; op: string; value: unknown }>;
  orderByField?: string;
  direction?: "asc" | "desc";
  pageSize?: number;
  startAfter?: unknown;
}

export interface IInvoiceRepository {
  fetchPage(uid: string, options: FetchInvoiceOptions): Promise<InvoicePageDomain>;
  getInvoiceByNumber(uid: string, invoiceNumber: string): Promise<BillingModel | null>;
  getAllBillings(uid: string): Promise<BillingModel[]>;
  createInvoice(uid: string, billing: BillingModel): Promise<BillingModel>;
  updateInvoice(uid: string, billingNumber: string, data: Partial<BillingModel>): Promise<void>;
  deleteInvoice(uid: string, billingNumber: string): Promise<void>;
}
