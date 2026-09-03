export interface ArticleOrderModel {
  name: string;
  color: string;
  delivered: number;
  pairs: number;
  value?: number; // Precio unitario del artículo
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

export interface OrderFilters {
  factory: string;
  search: string;
}
