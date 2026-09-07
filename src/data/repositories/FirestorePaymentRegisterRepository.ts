import {
  getCollection,
  setDocument,
  updateDocument,
  deleteDocument,
  where,
  orderBy,
  limit,
} from "@/data/datasources/firestore";
import { toPaymentRegisterDomain, toPaymentRegisterRemote } from "@/data/mappers/paymentRegisterMapper";
import type { RemotePaymentRegisterResult } from "@/data/remote/remotePaymentRegister";
import type { IPaymentRegisterRepository } from "@/domain/repositories/IPaymentRegisterRepository";
import type { PaymentRegisterModel } from "@/domain/entities/paymentRegister";

export class FirestorePaymentRegisterRepository implements IPaymentRegisterRepository {
  private path(uid: string) {
    return `users/${uid}/paymentRegister`;
  }

  async getMovements(
    uid: string,
    filters?: { clientId?: string; branch?: string },
  ): Promise<PaymentRegisterModel[]> {
    const constraints = [];
    if (filters?.clientId) constraints.push(where("Cliente ID", "==", filters.clientId));
    if (filters?.branch) constraints.push(where("Marca", "==", filters.branch));
    const remote = await getCollection<RemotePaymentRegisterResult>(this.path(uid), constraints);
    return remote.map(toPaymentRegisterDomain);
  }

  async createMovement(uid: string, movement: PaymentRegisterModel): Promise<void> {
    await setDocument(this.path(uid), String(movement.id), toPaymentRegisterRemote(movement));
  }

  async updateMovement(uid: string, id: number, data: Partial<PaymentRegisterModel>): Promise<void> {
    const remote: Partial<RemotePaymentRegisterResult> = {};
    if (data.id !== undefined) remote["Pago Id"] = data.id;
    if (data.clientId !== undefined) remote["Cliente ID"] = data.clientId;
    if (data.branch !== undefined) remote.Marca = data.branch;
    if (data.date !== undefined) remote.Fecha = data.date;
    if (data.clientName !== undefined) remote["Razón Social"] = data.clientName;
    if (data.documentNumber !== undefined) remote.Remito = data.documentNumber;
    if (data.type !== undefined) remote.Tipo = data.type;
    if (data.total !== undefined) remote["Monto pagado"] = data.total;
    if (data.notes !== undefined) remote.Notas = data.notes;
    if (data.method !== undefined) remote.Metodo = data.method;
    if (data.status !== undefined) remote.Estado = data.status;
    if (data.reconciliationDate !== undefined) remote["Fecha Conciliacion"] = data.reconciliationDate;
    if (data.confirmationTimestamp !== undefined) remote["Fecha Confirmacion"] = data.confirmationTimestamp;
    if (data.isVirtual !== undefined) remote["Es Virtual"] = data.isVirtual;
    await updateDocument(this.path(uid), String(id), remote);
  }

  async deleteMovement(uid: string, id: number): Promise<void> {
    await deleteDocument(this.path(uid), String(id));
  }

  async getNextId(uid: string): Promise<number> {
    const remote = await getCollection<RemotePaymentRegisterResult>(this.path(uid), [
      orderBy("Pago Id", "desc"),
      limit(1),
    ]);
    const lastId = remote[0]?.["Pago Id"] || 0;
    return lastId + 1;
  }
}
