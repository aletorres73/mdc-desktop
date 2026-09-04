export interface PaymentEntry {
  date: number;
  amount: number;
  status: "PENDIENTE" | "APROBADO" | "RECHAZADO" | string;
  transactionRef: string;
  receiptRef: string;
  paymentInfoId: string;
  paymentId: number;
}

export interface UserModel {
  uid: string;
  name: string;
  lastName: string;
  email: string;
  subscriptionExpiresAt: number;
  isManuallyEnabled: boolean;
  paymentHistory: PaymentEntry[];
}

export interface PaymentInfo {
  id: string;
  alias: string;
  cbu: string;
  titular: string;
  amount: number;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}
