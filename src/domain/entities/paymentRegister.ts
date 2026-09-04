export type MovementMethod =
  | "PAGO" | "EFECTIVO" | "TRANSFERENCIA" | "CHEQUE"
  | "PRONTO_PAGO" | "NOTA_CREDITO" | "DESCUENTO_EXTRA";

export type MovementStatus = "PENDIENTE" | "IMPUTADO";

export interface PaymentRegisterModel {
  id: number;
  clientId: string;
  branch: string;
  date: number;
  clientName: string;
  documentNumber: string;
  type: string;
  total: number;
  notes: string;
  method: MovementMethod;
  status: MovementStatus;
  reconciliationDate: number;
  confirmationTimestamp: number;
  isVirtual: boolean;
}