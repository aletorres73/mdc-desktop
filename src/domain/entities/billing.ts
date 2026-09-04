export type BillingState =
  | "Cobrado"
  | "Vencido"
  | "Por vencer"
  | "Pendiente"
  | "Cerrada"
  | "Devuelta"
  | "Cancelado";

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

export interface BillingModel {
  id?: string;
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
}

export interface RemoteResultBillingModel {
  Numero: string;
  Orden: string;
  "Tipo Facturacion": string;
  Total: string;
  Fecha: number;
  "Fecha recepción": number;
  "Fecha Pago": number;
  Articulos: unknown[];
  "Condicion de pago": string;
  Dto: number;
  "A cobrar": number;
  Pagado: string;
  Saldo: string;
  Estado: string;
  "Cliente Id": string;
  Marca: string;
  Segmento: string;
  Comentarios: unknown[];
  "Razon Social": string;
  Timestamp: number;
}

export interface InvoicePage {
  items: BillingModel[];
  nextCursor: string | null;
  quantity: number;
  endReached: boolean;
}
