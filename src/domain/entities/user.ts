export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
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

export interface RemoteInitConfig {
  apkUrl: string;
  enable: boolean;
  minSupported: string;
  releaseNotes: string;
  versionCode: number;
  versionName: string;
}
