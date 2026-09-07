import type { PaymentRegisterModel } from "@/domain/entities/paymentRegister";
import type { BillingModel } from "@/domain/entities/billing";

/**
 * Filtros del registro de pagos. "" significa "sin filtro".
 * - search: razón social o número de remito/factura.
 * - factory: campo "Marca" del movimiento (guarda la fábrica del documento).
 * - segment: segmento de la factura asociada (se resuelve por documentNumber).
 */
export interface MovementFilters {
  search: string;
  method: string;
  status: string;
  factory: string;
  segment: string;
}

export const EMPTY_MOVEMENT_FILTERS: MovementFilters = {
  search: "",
  method: "",
  status: "",
  factory: "",
  segment: "",
};

export function normalizeMovementSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function matchesMovementSearch(movement: PaymentRegisterModel, normalizedSearch: string): boolean {
  if (!normalizedSearch) return true;
  return (
    movement.clientName.toLowerCase().includes(normalizedSearch) ||
    movement.documentNumber.toLowerCase().includes(normalizedSearch)
  );
}

/** Mapa número de documento (minúsculas) -> segmento, construido desde las facturas. */
export function buildSegmentByDocument(
  invoices: Array<Pick<BillingModel, "billingNumber" | "branch">>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const invoice of invoices) {
    const key = invoice.billingNumber.trim().toLowerCase();
    if (!key || map.has(key)) continue;
    map.set(key, invoice.branch);
  }
  return map;
}

export function filterMovements(
  movements: PaymentRegisterModel[],
  filters: MovementFilters,
  segmentByDocument: ReadonlyMap<string, string> = new Map(),
): PaymentRegisterModel[] {
  const normalized = normalizeMovementSearch(filters.search);
  return movements.filter((movement) => {
    if (!matchesMovementSearch(movement, normalized)) return false;
    if (filters.method && movement.method !== filters.method) return false;
    if (filters.status && movement.status !== filters.status) return false;
    if (filters.factory && movement.branch !== filters.factory) return false;
    if (filters.segment) {
      const segment = segmentByDocument.get(movement.documentNumber.trim().toLowerCase()) ?? "";
      if (segment !== filters.segment) return false;
    }
    return true;
  });
}

export function distinctMovementValues(
  movements: PaymentRegisterModel[],
  pick: (movement: PaymentRegisterModel) => string,
): string[] {
  const values = new Set<string>();
  for (const movement of movements) {
    const value = pick(movement).trim();
    if (value) values.add(value);
  }
  return [...values].sort((a, b) => a.localeCompare(b));
}
