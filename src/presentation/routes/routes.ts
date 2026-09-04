export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGN_UP: "/sign-up",
  FORGOT_PASSWORD: "/forgot-password",
  SUBSCRIPTION: "/subscription",
  CLIENTS: "/clients",
  CLIENT_DETAIL: "/clients/:clientId",
  INVOICES: "/invoices",
  INVOICE_DETAIL: "/invoices/:invoiceNumber",
  ORDERS: "/orders",
  ORDER_DETAIL: "/orders/:clientId/:orderId",
  CREATE_ORDER: "/orders/create",
  FACTORIES: "/factories",
  FACTORY_DETAIL: "/factories/:factoryName",
  COMMISSIONS: "/commissions",
  AGENDA: "/agenda",
  PROFILE: "/profile",
  PAYMENT_REGISTER: "/payment-register",
} as const;

export function clientDetailRoute(clientId: string) {
  return `/clients/${encodeURIComponent(clientId)}`;
}

export function orderDetailRoute(clientId: string, orderId: string) {
  return `/orders/${encodeURIComponent(clientId)}/${encodeURIComponent(orderId)}`;
}

export function invoiceDetailRoute(invoiceNumber: string) {
  return `/invoices/${encodeURIComponent(invoiceNumber)}`;
}

export function factoryDetailRoute(factoryName: string) {
  return `/factories/${encodeURIComponent(factoryName)}`;
}

export function createOrderRoute(clientId?: string, orderId?: string) {
  const params = new URLSearchParams();
  if (clientId) params.set("clientId", clientId);
  if (orderId) params.set("orderId", orderId);
  const qs = params.toString();
  return `/orders/create${qs ? `?${qs}` : ""}`;
}
