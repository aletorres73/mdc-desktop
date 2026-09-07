import type { BillingModel } from "@/domain/entities/billing";

export const INVOICE_STATE_OPTIONS = [
  "Todas",
  "Pendiente",
  "Cobrado",
  "Vencido",
  "Por vencer",
  "Devuelta",
  "Cerrada",
] as const;

export type InvoiceStateFilter = (typeof INVOICE_STATE_OPTIONS)[number];

export function normalizeInvoiceSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function matchesInvoiceSearch(invoice: BillingModel, normalizedSearch: string): boolean {
  if (!normalizedSearch) return true;

  const clientName = invoice.clientName.toLowerCase();
  const billingNumber = invoice.billingNumber.toLowerCase();
  return clientName.includes(normalizedSearch) || billingNumber.includes(normalizedSearch);
}

export function matchesInvoiceState(invoice: BillingModel, state: InvoiceStateFilter): boolean {
  if (state === "Todas") return true;
  return invoice.stateBilling === state;
}
