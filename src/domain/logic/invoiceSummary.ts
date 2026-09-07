import type { BillingModel } from "@/domain/entities/billing";

export interface InvoiceSummary {
  total: number;
  paid: number;
  remaining: number;
  discount: number;
  articleCount: number;
}

export function summarizeInvoice(billing: BillingModel): InvoiceSummary {
  return {
    total: Number(billing.total ?? 0),
    paid: Number(billing.payed ?? 0),
    remaining: Number(billing.rest ?? 0),
    discount: Number(billing.expectedDiscount ?? 0),
    articleCount: Array.isArray(billing.articles) ? billing.articles.length : 0,
  };
}
