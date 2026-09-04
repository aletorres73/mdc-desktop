import type { IPaymentRegisterRepository, PaymentRegisterFilters } from "@/domain/repositories/IPaymentRegisterRepository";
import type { MovementStatus, PaymentRegisterModel } from "@/domain/entities/paymentRegister";
import { deleteDocument, getCollection, setDocument, updateDocument } from "../datasources";
import type { RemotePaymentRegisterResult } from "../remote/remoteResultPaymentRegister";
import { toPaymentRegisterDomain, toPaymentRegisterRemote } from "../mappers/paymentRegisterMapper";

function paymentsPath(uid: string): string { return `users/${uid}/paymentRegister`; }

export class FirestorePaymentRegisterRepository implements IPaymentRegisterRepository {
  async getAll(uid: string, filters: PaymentRegisterFilters = {}): Promise<PaymentRegisterModel[]> {
    const remoteFilters = [
      filters.clientId ? { field: "Cliente ID", op: "=" as const, value: filters.clientId } : null,
      filters.branch ? { field: "Marca", op: "=" as const, value: filters.branch } : null,
    ].filter((filter): filter is { field: string; op: "="; value: string } => filter !== null);
    const docs = await getCollection<RemotePaymentRegisterResult>(paymentsPath(uid), {
      filters: remoteFilters, orderBy: { field: "Fecha", direction: "desc" },
    });
    return docs.map(toPaymentRegisterDomain);
  }

  async getLastId(uid: string): Promise<number> {
    const docs = await getCollection<RemotePaymentRegisterResult>(paymentsPath(uid));
    return docs.reduce((lastId, payment) => Math.max(lastId, Number(payment["Pago Id"]) || 0), 0);
  }

  async save(uid: string, payment: PaymentRegisterModel): Promise<void> {
    await setDocument(paymentsPath(uid), String(payment.id), toPaymentRegisterRemote(payment) as unknown as Record<string, unknown>);
  }

  async updateStatus(uid: string, paymentId: number, status: MovementStatus, date: number): Promise<void> {
    await updateDocument(paymentsPath(uid), String(paymentId), { Estado: status, "Fecha Conciliacion": date, "Fecha Confirmacion": date });
  }

  async delete(uid: string, paymentId: number): Promise<void> { await deleteDocument(paymentsPath(uid), String(paymentId)); }
}