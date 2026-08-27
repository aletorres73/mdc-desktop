import type { FactoryModel } from "../entities/factory";
import type { BillingModel } from "../entities/invoice";

export interface CommissionConfig {
  deductIVA: boolean;
  ivaRate: number;
}

export const DEFAULT_COMMISSION_CONFIG: CommissionConfig = {
  deductIVA: true,
  ivaRate: 0.21,
};

export interface FactoryCommissionSummary {
  factoryName: string;
  defaultCommission: number;
  totalCollected: number;
  totalCommissionEarned: number;
  segmentBreakdown: Record<string, { rate: number; collected: number; commission: number }>;
}

export class CommissionCalculator {
  static calculate(
    amount: number,
    factory: FactoryModel,
    branch: string,
    docType: string,
    config: CommissionConfig = DEFAULT_COMMISSION_CONFIG
  ): number {
    const commissionRate = factory.segmentCommissions[branch] ?? factory.defaultCommission;
    if (commissionRate <= 0.0) return 0.0;

    const isFactura = docType.toLowerCase().includes("factura");
    const taxableAmount = isFactura && config.deductIVA
      ? amount / (1.0 + config.ivaRate)
      : amount;

    return (taxableAmount * commissionRate) / 100.0;
  }

  static calculateCommissionsFromBillings(
    billings: BillingModel[],
    factories: FactoryModel[],
    config: CommissionConfig = DEFAULT_COMMISSION_CONFIG
  ): FactoryCommissionSummary[] {
    const factoryMap = new Map<string, FactoryModel>();
    factories.forEach((f) => factoryMap.set(f.name, f));

    const summaries = new Map<string, FactoryCommissionSummary>();

    factories.forEach((f) => {
      summaries.set(f.name, {
        factoryName: f.name,
        defaultCommission: f.defaultCommission,
        totalCollected: 0,
        totalCommissionEarned: 0,
        segmentBreakdown: {},
      });
    });

    billings.forEach((billing) => {
      const factory = factoryMap.get(billing.brand);
      if (!factory) return;

      const summary = summaries.get(factory.name)!;
      const collectedAmount = billing.payed > 0 ? billing.payed : billing.total;
      const commission = CommissionCalculator.calculate(
        collectedAmount,
        factory,
        billing.branch,
        billing.type,
        config
      );

      summary.totalCollected += collectedAmount;
      summary.totalCommissionEarned += commission;

      const branchKey = billing.branch || "General";
      if (!summary.segmentBreakdown[branchKey]) {
        const rate = factory.segmentCommissions[billing.branch] ?? factory.defaultCommission;
        summary.segmentBreakdown[branchKey] = { rate, collected: 0, commission: 0 };
      }

      summary.segmentBreakdown[branchKey].collected += collectedAmount;
      summary.segmentBreakdown[branchKey].commission += commission;
    });

    return Array.from(summaries.values());
  }
}
