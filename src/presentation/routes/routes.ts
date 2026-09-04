export const ROUTES = {
  LOGIN: "/login",
  SIGN_UP: "/sign-up",
  FORGOT_PASSWORD: "/forgot-password",
  SUBSCRIPTION: "/subscription",
  PROFILE: "/profile",
  HOME: "/",
  INVOICES: "/invoices",
  CREATE_INVOICE: "/invoices/new",
  INVOICE_DETAIL: "/invoices/:invoiceId",
  EDIT_INVOICE: "/invoices/:invoiceId/edit",
  CLIENTS: "/clients",
  CLIENT_DETAIL: "/clients/:clientId",
  ORDERS: "/orders",
  ORDER_DETAIL: "/clients/:clientId/orders/:orderId",
  CREATE_ORDER: "/clients/:clientId/orders/new",
  FACTORIES: "/factories",
  FACTORY_DETAIL: "/factories/:factoryName",
  AGENDA: "/agenda",
  COMMISSIONS: "/commissions",
  PAYMENT_REGISTER: "/payment-register",
} as const;

export function invoiceDetailPath(invoiceId: string) {
  return `/invoices/${invoiceId}`;
}

export function editInvoicePath(invoiceId: string) {
  return `/invoices/${invoiceId}/edit`;
}

export function clientDetailPath(clientId: string) {
  return `/clients/${clientId}`;
}

export function orderDetailPath(clientId: string, orderId: string) {
  return `/clients/${clientId}/orders/${orderId}`;
}

export function createOrderPath(clientId: string) {
  return `/clients/${clientId}/orders/new`;
}

export function factoryDetailPath(factoryName: string) {
  return `/factories/${encodeURIComponent(factoryName)}`;
}
