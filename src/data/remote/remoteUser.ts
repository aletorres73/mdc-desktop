export interface RemoteResultPaymentEntry {
  date: number;
  amount: number;
  status: string;
  transactionRef: string;
  receiptRef: string;
  paymentInfoId: string;
  paymentId: number;
}

export interface RemoteResultUserModel {
  uid: string;
  name: string;
  lastName: string;
  email: string;
  subscriptionExpiresAt: number;
  isManuallyEnabled: boolean;
  paymentHistory: RemoteResultPaymentEntry[];
}

export interface RemotePaymentInfo {
  id: string;
  alias: string;
  cbu: string;
  titular: string;
  amount: number;
}
