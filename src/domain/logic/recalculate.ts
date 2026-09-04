import type { BillingModel } from "@/domain/entities/billing";
import type { FactoryModel } from "@/domain/entities/factory";

const MS_DAY = 1000 * 60 * 60 * 24;

/**
 * Recalcula saldo, fecha de pago y estado de una factura según reglas de negocio Android.
 */
export function recalculateBilling(
  billing: BillingModel,
  factory?: FactoryModel,
  now: number = Date.now(),
): BillingModel {
  const rest = billing.toPay - billing.payed;

  let payDate = billing.payDate;
  if (billing.deliveryDate && billing.paymentCondition && factory) {
    const condition = factory.paymentType.find((p) => p.paymentName === billing.paymentCondition);
    if (condition) {
      payDate = billing.deliveryDate + condition.expiration * MS_DAY;
    }
  }

  let stateBilling = "Pendiente";
  if (rest <= 0) {
    stateBilling = "Cobrado";
  } else if (payDate && now > payDate) {
    stateBilling = "Vencido";
  } else if (payDate && payDate - now <= MS_DAY) {
    stateBilling = "Por vencer";
  }

  return {
    ...billing,
    rest,
    payDate,
    stateBilling,
  };
}
