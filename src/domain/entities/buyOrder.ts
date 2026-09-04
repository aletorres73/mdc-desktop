export interface ArticleOrderModel {
  name: string;
  color: string;
  delivered: number;
  pairs: number;
  value?: number;
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
