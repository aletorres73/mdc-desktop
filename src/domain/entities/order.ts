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
  documents: string | null;
  checked: string | null;
  calendar: string | null;
  date: number;
}
