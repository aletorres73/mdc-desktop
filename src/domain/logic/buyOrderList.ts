import type { BuyOrderModel } from "@/domain/entities/buyOrder";

/**
 * Filtros del listado global de pedidos. "" significa "sin filtro".
 * - search: razón social o número de pedido.
 * - factory: fábrica del pedido.
 * - branch: segmento del pedido.
 */
export interface BuyOrderListFilters {
  search: string;
  factory: string;
  branch: string;
}

export const EMPTY_BUY_ORDER_FILTERS: BuyOrderListFilters = {
  search: "",
  factory: "",
  branch: "",
};

export function normalizeBuyOrderSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function matchesBuyOrderSearch(order: BuyOrderModel, normalizedSearch: string): boolean {
  if (!normalizedSearch) return true;
  return (
    order.client.toLowerCase().includes(normalizedSearch) ||
    order.order.toLowerCase().includes(normalizedSearch) ||
    order.id.toLowerCase().includes(normalizedSearch)
  );
}

export function filterBuyOrders(orders: BuyOrderModel[], filters: BuyOrderListFilters): BuyOrderModel[] {
  const normalized = normalizeBuyOrderSearch(filters.search);
  return orders.filter(
    (order) =>
      matchesBuyOrderSearch(order, normalized) &&
      (!filters.factory || order.factory === filters.factory) &&
      (!filters.branch || order.branch === filters.branch),
  );
}

export function sortBuyOrdersByRecency(orders: BuyOrderModel[]): BuyOrderModel[] {
  return [...orders].sort((a, b) => b.timeStamp - a.timeStamp);
}

export function distinctBuyOrderValues(
  orders: BuyOrderModel[],
  pick: (order: BuyOrderModel) => string,
): string[] {
  const values = new Set<string>();
  for (const order of orders) {
    const value = pick(order).trim();
    if (value) values.add(value);
  }
  return [...values].sort((a, b) => a.localeCompare(b));
}
