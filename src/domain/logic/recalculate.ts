import type { BillingModel } from "../entities/invoice";
import type { PaymentCondition } from "../entities/factory";

export function recalculateBilling(
  billing: BillingModel,
  condition?: PaymentCondition | null
): BillingModel {
  const toPayValue = billing.total;
  const restValue = toPayValue - billing.payed;

  let newPayDate = billing.payDate;

  if (billing.deliveryDate !== 0 && condition) {
    const millisInDay = 86400000;
    newPayDate = billing.deliveryDate + condition.expiration * millisInDay;
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
