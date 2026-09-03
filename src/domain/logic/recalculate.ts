import type { BillingModel } from "../entities/invoice";
import type { PaymentCondition } from "../entities/factory";

export interface InvoicePaymentInput {
  amount: number;
  type?: "real" | "virtual";
  status?: "pendiente" | "imputado" | "conciliado";
  note?: string;
  virtualType?: "pronto-pago" | "nota-credito" | "descuento-extra" | string;
}

export interface InvoicePaymentEntry {
  id: string;
  amount: number;
  type: "real" | "virtual";
  status: "pendiente" | "imputado" | "conciliado";
  note?: string;
  virtualType?: string;
  date: number;
}

export function recalculateBilling(
  billing: BillingModel,
  condition?: PaymentCondition | null
): BillingModel {
  // Use toPay if available (already includes discount), otherwise use total
  const toPayValue = billing.toPay || billing.total;
  const restValue = toPayValue - billing.payed;

  let newPayDate = billing.payDate;

  // Only calculate payDate if deliveryDate is set and condition is provided
  if (billing.deliveryDate !== 0 && condition) {
    const millisInDay = 86400000;
    newPayDate = billing.deliveryDate + condition.expiration * millisInDay;
  } else if (billing.deliveryDate === 0) {
    // Keep payDate as 0 when no delivery date is set
    newPayDate = 0;
  } else if (!billing.paymentCondition && !condition) {
    newPayDate = 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMillis = today.getTime();

  let newState = billing.stateBilling;

  if (restValue <= 0 && toPayValue > 0) {
    newState = "Cobrado";
  } else if (
    billing.stateBilling === "Cerrada" ||
    billing.stateBilling === "Devuelta" ||
    billing.stateBilling === "Cancelado"
  ) {
    newState = billing.stateBilling;
  } else if (newPayDate !== 0 && restValue > 0) {
    const millisPerDay = 86400000;
    const daysUntilDue = (newPayDate - todayMillis) / millisPerDay;

    if (todayMillis > newPayDate) {
      newState = "Vencido";
    } else if (daysUntilDue <= 1) {
      newState = "Por vencer";
    } else {
      newState = "Pendiente";
    }
  } else if (billing.payed > 0 && restValue > 0) {
    newState = "Pendiente";
  } else {
    newState = billing.stateBilling || "Pendiente";
  }

  return {
    ...billing,
    toPay: toPayValue,
    rest: restValue,
    payDate: newPayDate,
    stateBilling: newState,
  };
}

export function updateInvoiceDetails(
  billing: BillingModel,
  updates: Partial<BillingModel>
): BillingModel {
  const nextBilling: BillingModel = {
    ...billing,
    ...updates,
    comments: updates.comments ? updates.comments.filter((comment) => comment.comments.trim()) : billing.comments,
  };

  return recalculateBilling(nextBilling);
}

export function addInvoiceComment(
  billing: BillingModel,
  comment: string
): BillingModel {
  if (!comment || !comment.trim()) {
    return billing;
  }

  return updateInvoiceDetails(billing, {
    comments: [...billing.comments, { comments: comment.trim(), date: Date.now() }],
  });
}

function sumRealPayments(payments: InvoicePaymentEntry[] | undefined): number {
  return (payments ?? [])
    .filter((p) => p.type === "real")
    .reduce((total, payment) => total + (payment.amount || 0), 0);
}

function sumVirtualPayments(payments: InvoicePaymentEntry[] | undefined): number {
  return (payments ?? [])
    .filter((p) => p.type === "virtual")
    .reduce((total, payment) => total + (payment.amount || 0), 0);
}

function computePaymentState(
  billing: BillingModel,
  payments: InvoicePaymentEntry[] | undefined
): BillingModel {
  const realPaymentTotal = sumRealPayments(payments);
  const virtualPaymentTotal = sumVirtualPayments(payments);
  const baseToPay = billing.toPay || billing.total || 0;
  const nextToPay = Math.max(0, baseToPay - virtualPaymentTotal);
  const virtualDiscountRate = baseToPay > 0 ? (virtualPaymentTotal / baseToPay) * 100 : 0;

  const nextBilling = {
    ...billing,
    payed: realPaymentTotal,
    toPay: nextToPay,
    rest: nextToPay - realPaymentTotal,
    expectedDiscount: Math.max(billing.expectedDiscount, Number(virtualDiscountRate.toFixed(2))),
  };

  return recalculateBilling(nextBilling);
}

export function applyInvoicePayment(
  billing: BillingModel,
  payment: InvoicePaymentInput
): BillingModel {
  const amount = Math.max(0, Number(payment.amount) || 0);
  const paymentEntries: InvoicePaymentEntry[] = [
    ...(billing as BillingModel & { payments?: InvoicePaymentEntry[] }).payments ?? [],
    {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      amount,
      type: payment.type ?? "real",
      status: payment.status ?? "imputado",
      note: payment.note,
      virtualType: payment.virtualType,
      date: Date.now(),
    },
  ];

  const nextComments = payment.note?.trim()
    ? [...billing.comments, { comments: payment.note.trim(), date: Date.now() }]
    : [...billing.comments];

  const updatedBilling: BillingModel & { payments?: InvoicePaymentEntry[] } = {
    ...billing,
    comments: nextComments,
    payments: paymentEntries,
  };

  return computePaymentState(updatedBilling as BillingModel, paymentEntries);
}

export function updateInvoicePayment(
  billing: BillingModel,
  paymentIndex: number,
  changes: Partial<InvoicePaymentInput & { amount: number; status: string; note?: string }>
): BillingModel {
  const payments = [...((billing as BillingModel & { payments?: InvoicePaymentEntry[] }).payments ?? [])];
  if (paymentIndex < 0 || paymentIndex >= payments.length) return billing;

  const target = payments[paymentIndex];
  const updatedPayment: InvoicePaymentEntry = {
    ...target,
    amount: Math.max(0, Number(changes.amount ?? target.amount) || 0),
    status: (changes.status as InvoicePaymentEntry["status"]) ?? target.status,
    note: changes.note ?? target.note,
    date: target.date,
  };

  payments[paymentIndex] = updatedPayment;

  const nextBilling = {
    ...billing,
    payments,
  };

  return computePaymentState(nextBilling as BillingModel, payments);
}

export function deleteInvoicePayment(
  billing: BillingModel,
  paymentIndex: number
): BillingModel {
  const payments = [...((billing as BillingModel & { payments?: InvoicePaymentEntry[] }).payments ?? [])];
  if (paymentIndex < 0 || paymentIndex >= payments.length) return billing;

  payments.splice(paymentIndex, 1);

  const nextBilling = {
    ...billing,
    payments,
  };

  return computePaymentState(nextBilling as BillingModel, payments);
}

export function reconcileInvoicePayment(
  billing: BillingModel,
  paymentIndex: number
): BillingModel {
  const payments = [...((billing as BillingModel & { payments?: InvoicePaymentEntry[] }).payments ?? [])];
  if (paymentIndex < 0 || paymentIndex >= payments.length) return billing;

  payments[paymentIndex] = {
    ...payments[paymentIndex],
    status: "conciliado",
  };

  const nextBilling = {
    ...billing,
    payments,
  };

  return computePaymentState(nextBilling as BillingModel, payments);
}
