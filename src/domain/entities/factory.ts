export interface PaymentCondition {
  paymentName: string;
  discount: number;
  month: number;
  expiration: number;
  date: number;
  quantity: number;
}

export interface FactoryModel {
  name: string;
  branchList: string[];
  paymentType: PaymentCondition[];
  defaultCommission: number;
  segmentCommissions: Record<string, number>;
}

export interface CommissionConfig {
  deductIVA: boolean;
  ivaRate: number;
}
