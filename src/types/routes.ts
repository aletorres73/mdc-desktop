// Route definitions — mirrors Kotlin AppRoute sealed class
// Source: AppRoute.kt

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGN_UP: "/sign-up",
  CLIENTS: "/clients",
  ADD_CLIENT: "/add-client",
  CLIENT_ORDERS: "/clients/:clientId/orders",
  CREATE_ORDER: "/create-order",
  ORDERS: "/orders/:factoryName",
  ORDER_DETAIL: "/order-detail",
  FACTORIES: "/factories",
  INVOICES_PAGED: "/invoices",
  INVOICES: "/invoices/:clientId",
  ADD_INVOICE: "/invoices/:clientId/:orderId",
  DETAIL_INVOICE: "/invoices/detail/:invoiceNumber",
  COMMISSIONS: "/commissions",
  AGENDA: "/agenda",
  PROFILE: "/profile",
  SUBSCRIPTION_STATUS: "/subscription",
  PAYMENT_HISTORY: "/payment-history",
} as const;

// Helper to build parameterized routes
export function clientOrdersRoute(clientId: string) {
  return `/clients/${clientId}/orders`;
}

export function ordersRoute(factoryName: string) {
  return `/orders/${encodeURIComponent(factoryName)}`;
}

export function orderDetailRoute(
  clientId: string,
  orderId: string,
  factoryName: string
) {
  return `/order-detail?clientId=${clientId}&orderId=${orderId}&factoryName=${encodeURIComponent(factoryName)}`;
}

export function invoicesRoute(clientId: string) {
  return `/invoices/${clientId}`;
}

export function addInvoiceRoute(clientId: string, orderId: string) {
  return `/invoices/${clientId}/${orderId}`;
}

export function detailInvoiceRoute(invoiceNumber: string) {
  return `/invoices/detail/${invoiceNumber}`;
}

export function addClientRoute(id?: string, name?: string) {
  if (id && name) return `/add-client?id=${id}&name=${encodeURIComponent(name)}`;
  return "/add-client";
}

export function createOrderRoute(clientId?: string, orderId?: string) {
  const params = new URLSearchParams();
  if (clientId) params.set("clientId", clientId);
  if (orderId) params.set("orderId", orderId);
  const qs = params.toString();
  return `/create-order${qs ? `?${qs}` : ""}`;
}
