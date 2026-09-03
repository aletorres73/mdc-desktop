export interface ArticleModel {
  name: string;
  color: string;
  value: number;
  pairs: number;
}

export interface BillingComments {
  comments: string;
  date: number;
}

export interface BillingPayment {
  id: string;
  amount: number;
  type: "real" | "virtual";
  status: "pendiente" | "imputado" | "conciliado";
  note?: string;
  virtualType?: string;
  date: number;
}

export interface BillingModel {
  billingNumber: string;
  orderId: string;
  type: string;
  total: number;
  loadDate: number;
  deliveryDate: number;
  payDate: number;
  articles: ArticleModel[];
  paymentCondition: string;
  expectedDiscount: number;
  toPay: number;
  payed: number;
  rest: number;
  stateBilling: string;
  clientId: string;
  brand: string;
  branch: string;
  comments: BillingComments[];
  clientName: string;
  timeStamp: number;
  payments?: BillingPayment[];
}

export interface InvoiceFilters {
  state: string;
  client: string;
  number: string;
}

export interface InvoicePageDomain {
  items: BillingModel[];
  nextCursor: string | null;
  quantity: number;
  endReached: boolean;
}
