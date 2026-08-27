import type { PaymentCondition } from "../entities/factory";

export class PaymentConditionService {
  static isEmpty(pc: PaymentCondition): boolean {
    return (
      pc.discount === 0 &&
      pc.month === 0 &&
      pc.expiration === 0 &&
      pc.date === 0 &&
      (!pc.paymentName || pc.paymentName.trim() === "")
    );
  }

  static filterValid(conditions: PaymentCondition[]): PaymentCondition[] {
    return conditions.filter((c) => !PaymentConditionService.isEmpty(c));
  }
}
