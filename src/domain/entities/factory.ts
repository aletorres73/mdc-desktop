export interface FactoryModel {
  name: string;
  branchList: string[];
  paymentType: PaymentCondition[];
  defaultCommission: number;
  segmentCommissions: Record<string, number>;
}

export interface PaymentCondition {
  paymentName: string;
  discount: number;
  month: number;
  expiration: number;
  date: number;
  quantity: number;
}

export function isEmptyPaymentCondition(pc: PaymentCondition): boolean {
  return (
    pc.discount === 0 &&
    pc.month === 0 &&
    pc.expiration === 0 &&
    pc.date === 0 &&
    pc.paymentName === ""
  );
}
