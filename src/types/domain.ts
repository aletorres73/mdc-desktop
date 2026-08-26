// Domain types — mirrors Kotlin Entities.kt
// FactoryModel, PaymentCondition, PaymentEntry

export interface FactoryModel {
  name: string; // "Fabrica"
  branchList: string[]; // "Marcas"
  paymentType: PaymentCondition[]; // "Condiciones"
  defaultCommission: number; // "ComisionBase"
  segmentCommissions: Record<string, number>; // "ComisionesSegmento"
}

export interface PaymentCondition {
  paymentName: string; // "condicion"
  discount: number; // "dto"
  month: number; // "meses"
  expiration: number; // "vencimiento"
  date: number; // "plazo"
  quantity: number; // "pagos"
}

export function isEmptyPaymentCondition(pc: PaymentCondition): boolean {
  return (
    pc.discount === 0 &&
    pc.month === 0 &&
    pc.expiration === 0 &&
    pc.date === 0 &&
    pc.paymentName === ""
  );
}

// Remote Firestore format for FactoryModel
export interface RemoteResultFactoryModel {
  Fabrica: string;
  Marcas: string[];
  Condiciones: Record<string, Record<string, string>>;
  ComisionBase: number;
  ComisionesSegmento: Record<string, number>;
}

// Remote init config
export interface RemoteInitConfig {
  apkUrl: string;
  enable: boolean;
  minSupported: string;
  releaseNotes: string;
  versionCode: number;
  versionName: string;
}

// User profile (Firestore)
export interface UserModel {
  uid: string;
  name: string;
  lastName: string;
  email: string;
  subscriptionExpiresAt: number;
  isManuallyEnabled: boolean;
  paymentHistory: PaymentEntry[];
}

export interface PaymentEntry {
  date: number;
  amount: number;
  status: string;
  transactionRef: string;
  receiptRef: string;
  paymentInfoId: string;
  paymentId: number;
}

export interface PaymentInfo {
  id: string;
  alias: string;
  cbu: string;
  titular: string;
  amount: number;
}

// ─── Invoice / Billing Types ───

export interface ArticleModel {
  name: string;
  color: string;
  value: number;
  pairs: number;
}

export interface BillingComments {
  comments: string;
  date: number; // epoch millis
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
}

// Remote Firestore format (matches RemoteResultBillingModel)
export interface RemoteResultBillingModel {
  Numero: string;
  Orden: string;
  "Tipo Facturacion": string;
  Total: string;
  Fecha: number;
  "Fecha recepción": number;
  "Fecha Pago": number;
  Articulos: RemoteArticle[];
  "Condicion de pago": string;
  Dto: number;
  "A cobrar": number;
  Pagado: string;
  Saldo: string;
  Estado: string;
  "Cliente Id": string;
  Marca: string;
  Segmento: string;
  Comentarios: RemoteBillingComments[];
  "Razon Social": string;
  Timestamp: number;
}

export interface RemoteArticle {
  Articulo: string;
  Color: string;
  Importe: string;
  Pares: string;
}

export interface RemoteBillingComments {
  comments: string;
  date: number;
}

// Pagination
export interface InvoicePage {
  items: RemoteResultBillingModel[];
  nextCursor: string | null;
  quantity: number;
  endReached: boolean;
}

// Domain version of InvoicePage (after conversion)
export interface InvoicePageDomain {
  items: BillingModel[];
  nextCursor: string | null;
  quantity: number;
  endReached: boolean;
}

// Convert remote → domain
export function toBillingDomain(remote: RemoteResultBillingModel): BillingModel {
  return {
    billingNumber: remote.Numero,
    orderId: remote.Orden,
    type: remote["Tipo Facturacion"],
    total: parseFloat(remote.Total) || 0,
    loadDate: remote.Fecha,
    deliveryDate: remote["Fecha recepción"],
    payDate: remote["Fecha Pago"],
    articles: remote.Articulos.map((a) => ({
      name: a.Articulo,
      color: a.Color,
      value: parseFloat(a.Importe) || 0,
      pairs: parseInt(a.Pares) || 0,
    })),
    paymentCondition: remote["Condicion de pago"],
    expectedDiscount: remote.Dto,
    toPay: remote["A cobrar"],
    payed: parseFloat(remote.Pagado) || 0,
    rest: parseFloat(remote.Saldo) || 0,
    stateBilling: remote.Estado,
    clientId: remote["Cliente Id"],
    brand: remote.Marca,
    branch: remote.Segmento,
    comments: remote.Comentarios.map((c) => ({
      comments: c.comments,
      date: c.date,
    })),
    clientName: remote["Razon Social"],
    timeStamp: remote.Timestamp,
  };
}

// Invoice filter state
export interface InvoiceFilters {
  state: string; // "Todas", "Pendiente", "Cobrado", "Vencido", etc.
  client: string; // prefix search
  number: string; // prefix search
}

// ─── Client Types ───

export interface ClientModel {
  clientId: string;
  clientName: string;
}

// Remote Firestore format (matches RemoteResultClientModel)
export interface RemoteResultClientModel {
  "Cliente Id": string;
  "Razón Social": string;
}

// Extended client info (matches RemoteResultInfoClientModel)
export interface RemoteResultInfoClientModel {
  "Cliente Id": string;
  "Razón Social": string;
  "Nombre fantasia": string;
  CUIT: string;
  "Direccion Comercio": string;
  "Direccion Fiscal": string;
  "Localidad Comercio": string;
  "Localidad Fiscal": string;
  "Horario de entrega": string;
  Email: string;
  Telefono: string;
}

// Convert remote → domain
export function toClientDomain(remote: RemoteResultClientModel): ClientModel {
  return {
    clientId: remote["Cliente Id"],
    clientName: remote["Razón Social"],
  };
}

// Client filter state
export interface ClientFilters {
  search: string; // search by name
}

// ─── Order / BuyOrder Types ───

export interface ArticleOrderModel {
  name: string;
  color: string;
  delivered: number;
  pairs: number;
}

export interface BuyOrderModel {
  id: string;
  clientId: string;
  order: string;
  client: string;
  factory: string;
  branch: string;
  deliveryDate: number;
  type: string;
  billing: string;
  comments: string;
  articles: ArticleOrderModel[];
  loadedDate: number;
  paymentCondition: string;
  discount: number;
  expirationDays: number;
  timeStamp: number;
}

export interface OrderModel {
  orderNumber: string;
  nameClient: string;
  branch: string;
  type: string;
  documentDate: number;
  numberDocument: string;
  trackingState: string;
  documentComments: string;
  sellOut: string;
  inputDate: number;
  payState: string;
  receptionDate: number;
  payDate: number;
  valueDocument: string;
  discount: string;
  payAmount: string;
  payedAmount: string;
  payDifference: string;
  orders: string;
  documents: string;
  checked: string;
  calendar: string;
  date: number;
}

// Remote Firestore format for BuyOrder (matches RemoteResultBuyOrder)
export interface RemoteResultBuyOrder {
  "Pedido Id": string;
  "Orden Id": string;
  "Cliente Id": string;
  "Razón Social": string;
  "Fábrica": string;
  "Marca": string;
  "Plazo de entrega": number;
  "Tipo": string;
  "Facturación": string;
  "Comentarios": string;
  "Articulos": RemoteArticleOrderModel[];
  "Fecha de carga": number;
  "Condición de Pago": string;
  "Descuento": number;
  "Días Vencimiento": number;
  "Timestamp": number;
}

export interface RemoteArticleOrderModel {
  "Articulo": string;
  "Color": string;
  "Entregados": string;
  "Pares": string;
}

// Remote Firestore format for Order (matches RemoteResultOrder)
export interface RemoteResultOrder {
  "N° ": string;
  "Razón Social": string;
  "Marca": string;
  "Tipo": string;
  "Fecha Remito/Factura": number;
  "N° Factura/Remito": string;
  "Estado de despacho": string;
  "Comentarios": string;
  "Descuentos": string;
  "Fecha de carga": number;
  "Estado de cobranza": string;
  "Fecha recepción": number;
  "Fecha de pago": number;
  "Importe fc/rt": string;
  "Desc / Dev": string;
  "Monto a cobrar": string;
  "Monto cobrado": string;
  "Diferencia": string;
  "Pedidos": string;
  "Remitos/ Facturas": string;
  "Comprobantes": string;
  "Calendario": string;
  "Plazo": number;
}

// Convert remote → domain
export function toBuyOrderDomain(remote: RemoteResultBuyOrder): BuyOrderModel {
  return {
    id: remote["Pedido Id"],
    clientId: remote["Cliente Id"],
    order: remote["Orden Id"],
    client: remote["Razón Social"],
    factory: remote["Fábrica"],
    branch: remote["Marca"],
    deliveryDate: remote["Plazo de entrega"],
    type: remote["Tipo"],
    billing: remote["Facturación"],
    comments: remote["Comentarios"],
    articles: remote["Articulos"].map((a) => ({
      name: a["Articulo"],
      color: a["Color"],
      delivered: parseInt(a["Entregados"]) || 0,
      pairs: parseInt(a["Pares"]) || 0,
    })),
    loadedDate: remote["Fecha de carga"],
    paymentCondition: remote["Condición de Pago"],
    discount: remote["Descuento"],
    expirationDays: remote["Días Vencimiento"],
    timeStamp: remote["Timestamp"],
  };
}

export function toOrderDomain(remote: RemoteResultOrder): OrderModel {
  return {
    orderNumber: remote["N° "],
    nameClient: remote["Razón Social"],
    branch: remote["Marca"],
    type: remote["Tipo"],
    documentDate: remote["Fecha Remito/Factura"],
    numberDocument: remote["N° Factura/Remito"],
    trackingState: remote["Estado de despacho"],
    documentComments: remote["Comentarios"],
    sellOut: remote["Descuentos"],
    inputDate: remote["Fecha de carga"],
    payState: remote["Estado de cobranza"],
    receptionDate: remote["Fecha recepción"],
    payDate: remote["Fecha de pago"],
    valueDocument: remote["Importe fc/rt"],
    discount: remote["Desc / Dev"],
    payAmount: remote["Monto a cobrar"],
    payedAmount: remote["Monto cobrado"],
    payDifference: remote["Diferencia"],
    orders: remote["Pedidos"],
    documents: remote["Remitos/ Facturas"],
    checked: remote["Comprobantes"],
    calendar: remote["Calendario"],
    date: remote["Plazo"],
  };
}

// Order filter state
export interface OrderFilters {
  factory: string; // "all" or factory name
  search: string; // search by client/order number
}
