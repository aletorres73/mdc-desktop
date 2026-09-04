import type { BillingModel, BillingPayment } from "@/domain/entities/invoice";
import type { MovementMethod, MovementStatus, PaymentRegisterModel } from "@/domain/entities/paymentRegister";
import type { RemotePaymentRegisterResult } from "../remote/remoteResultPaymentRegister";

const methods: MovementMethod[] = ["PAGO", "EFECTIVO", "TRANSFERENCIA", "CHEQUE", "PRONTO_PAGO", "NOTA_CREDITO", "DESCUENTO_EXTRA"];
const virtualMethods: Record<string, MovementMethod> = {
  "pronto-pago": "PRONTO_PAGO", "nota-credito": "NOTA_CREDITO", "descuento-extra": "DESCUENTO_EXTRA",
};

function movementMethod(payment: BillingPayment): MovementMethod {
  return payment.type === "virtual" ? virtualMethods[payment.virtualType ?? ""] ?? "PAGO" : "PAGO";
}

export function billingPaymentToRegister(billing: BillingModel, payment: BillingPayment, id: number): PaymentRegisterModel {
  const status: MovementStatus = payment.status === "pendiente" ? "PENDIENTE" : "IMPUTADO";
  return {
    id, clientId: billing.clientId, branch: billing.brand, date: payment.date,
    clientName: billing.clientName, documentNumber: billing.billingNumber,
    type: billing.type || "Factura", total: payment.amount, notes: payment.note ?? "",
    method: movementMethod(payment), status,
    reconciliationDate: payment.status === "conciliado" ? payment.date : 0,
    confirmationTimestamp: payment.status === "conciliado" ? payment.date : 0,
    isVirtual: payment.type === "virtual",
  };
}

export function toPaymentRegisterDomain(remote: RemotePaymentRegisterResult): PaymentRegisterModel {
  const method = methods.includes(remote.Metodo as MovementMethod) ? remote.Metodo as MovementMethod : "PAGO";
  return {
    id: remote["Pago Id"], clientId: remote["Cliente ID"], branch: remote.Marca, date: remote.Fecha,
    clientName: remote["Razón Social"], documentNumber: remote.Remito, type: remote.Tipo,
    total: Number(remote["Monto pagado"]) || 0, notes: remote.Notas ?? "", method,
    status: remote.Estado === "PENDIENTE" ? "PENDIENTE" : "IMPUTADO",
    reconciliationDate: remote["Fecha Conciliacion"] || 0,
    confirmationTimestamp: remote["Fecha Confirmacion"] || 0,
    isVirtual: Boolean(remote["Es Virtual"]),
  };
}

export function toPaymentRegisterRemote(domain: PaymentRegisterModel): RemotePaymentRegisterResult {
  return {
    "Pago Id": domain.id, "Cliente ID": domain.clientId, "Marca": domain.branch, "Fecha": domain.date,
    "Razón Social": domain.clientName, "Remito": domain.documentNumber, "Tipo": domain.type,
    "Monto pagado": domain.total, "Notas": domain.notes, "Metodo": domain.method, "Estado": domain.status,
    "Fecha Conciliacion": domain.reconciliationDate, "Fecha Confirmacion": domain.confirmationTimestamp,
    "Es Virtual": domain.isVirtual,
  };
}