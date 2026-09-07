import type { RemoteResultUserModel, RemoteResultPaymentEntry } from "@/data/remote/remoteUser";
import type { UserModel, PaymentEntry } from "@/domain/entities/user";

export function toUserDomain(remote: RemoteResultUserModel): UserModel {
  return {
    uid: remote.uid || "",
    name: remote.name || "",
    lastName: remote.lastName || "",
    email: remote.email || "",
    subscriptionExpiresAt: remote.subscriptionExpiresAt || 0,
    isManuallyEnabled: remote.isManuallyEnabled || false,
    paymentHistory: (remote.paymentHistory || []).map((p: RemoteResultPaymentEntry) => ({
      date: p.date || 0,
      amount: p.amount || 0,
      status: p.status || "PENDIENTE",
      transactionRef: p.transactionRef || "",
      receiptRef: p.receiptRef || "",
      paymentInfoId: p.paymentInfoId || "",
      paymentId: p.paymentId || 0,
    })),
  };
}

export function toUserRemote(domain: UserModel): RemoteResultUserModel {
  return {
    uid: domain.uid,
    name: domain.name,
    lastName: domain.lastName,
    email: domain.email,
    subscriptionExpiresAt: domain.subscriptionExpiresAt,
    isManuallyEnabled: domain.isManuallyEnabled,
    paymentHistory: domain.paymentHistory.map((p: PaymentEntry) => ({
      date: p.date,
      amount: p.amount,
      status: p.status,
      transactionRef: p.transactionRef,
      receiptRef: p.receiptRef,
      paymentInfoId: p.paymentInfoId,
      paymentId: p.paymentId,
    })),
  };
}
