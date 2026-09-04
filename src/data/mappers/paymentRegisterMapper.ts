import type { RemotePaymentRegisterResult } from "@/data/remote/remotePaymentRegister";
import type { PaymentRegisterModel, MovementMethod, MovementStatus } from "@/domain/entities/paymentRegister";

export function toPaymentRegisterDomain(remote: RemotePaymentRegisterResult): PaymentRegisterModel {
  return {
    id: remote["Pago Id"] || 0,
    clientId: remote["Cliente ID"] || "",
    branch: remote["Marca"] || "",
    date: remote["Fecha"] || 0,
    clientName: remote["Razón Social"] || "",
    documentNumber: remote["Remito"] || "",
    type: remote["Tipo"] || "",
    total: remote["Monto pagado"] || 0,
    notes: remote["Notas"] || "",
    method: (remote["Metodo"] as MovementMethod) || "TRANSFERENCIA",
    status: (remote["Estado"] as MovementStatus) || "PENDIENTE",
    reconciliationDate: remote["Fecha Conciliacion"] || 0,
    confirmationTimestamp: remote["Fecha Confirmacion"] || 0,
    isVirtual: remote["Es Virtual"] || false,
  };
}

export function toPaymentRegisterRemote(domain: PaymentRegisterModel): RemotePaymentRegisterResult {
  return {
    "Pago Id": domain.id,
    "Cliente ID": domain.clientId,
    Marca: domain.branch,
    Fecha: domain.date,
    "Razón Social": domain.clientName,
    Remito: domain.documentNumber,
    Tipo: domain.type,
    "Monto pagado": domain.total,
    Notas: domain.notes,
    Metodo: domain.method,
    Estado: domain.status,
    "Fecha Conciliacion": domain.reconciliationDate,
    "Fecha Confirmacion": domain.confirmationTimestamp,
    "Es Virtual": domain.isVirtual,
  };
}
