export type MovementMethod =
  | "PAGO"
  | "EFECTIVO"
  | "TRANSFERENCIA"
  | "CHEQUE"
  | "PRONTO_PAGO"
  | "NOTA_CREDITO"
  | "DESCUENTO_EXTRA";

export type MovementStatus = "PENDIENTE" | "COBRADO" | "RECONCILIADO" | "IMPUTADO";

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

export const VIRTUAL_MOVEMENT_METHODS: MovementMethod[] = [
  "PRONTO_PAGO",
  "NOTA_CREDITO",
  "DESCUENTO_EXTRA",
];

/** displayName alineado con MovementMethod de la app móvil. */
export const MOVEMENT_METHOD_LABELS: Record<MovementMethod, string> = {
  PAGO: "Pago",
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  CHEQUE: "Cheque",
  PRONTO_PAGO: "Pronto Pago",
  NOTA_CREDITO: "Nota de Crédito",
  DESCUENTO_EXTRA: "Descuento Extra",
};
