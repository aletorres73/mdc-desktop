// User types — mirrors Kotlin UserModel + PaymentEntry + PaymentInfo
// Source: Entities.kt / RemoteResultUserModel.kt

export interface UserModel {
  uid: string;
  name: string;
  lastName: string;
  email: string;
  subscriptionExpiresAt: number; // epoch millis
  isManuallyEnabled: boolean;
  paymentHistory: PaymentEntry[];
}

export interface PaymentEntry {
  date: number; // epoch millis
  amount: number;
  status: string; // "PENDIENTE" | "APROBADO" | "RECHAZADO"
  transactionRef: string;
  receiptRef: string; // Storage file reference
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

// RemoteInitConfig — mirrors Kotlin RemoteInitConfig.kt
export interface RemoteInitConfig {
  apkUrl: string;
  enable: boolean;
  minSupported: string;
  releaseNotes: string;
  versionCode: number;
  versionName: string;
}
