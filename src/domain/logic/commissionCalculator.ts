import type { FactoryModel, CommissionConfig } from "@/domain/entities/factory";
import type { BillingModel } from "@/domain/entities/billing";

const DEFAULT_CONFIG: CommissionConfig = { deductIVA: true, ivaRate: 0.21 };

/**
 * Calcula comisión de una factura: prioriza tasa por segmento (marca) sobre default de fábrica,
 * y deduce IVA de la base si el tipo de documento es "Factura".
 */
export function calculateCommission(
  billing: BillingModel,
  factories: FactoryModel[],
  config: CommissionConfig = DEFAULT_CONFIG,
): number {
  const factoryMap = new Map(factories.map((f) => [f.name, f]));
  const factory = factoryMap.get(billing.brand);
  if (!factory) return 0;

  const rate = factory.segmentCommissions[billing.branch] ?? factory.defaultCommission;
  const typeName = billing.type?.toLowerCase() ?? "";

  let base = billing.total;
  if (config.deductIVA && typeName.includes("factura")) {
    base = base / (1 + config.ivaRate);
  }

  return base * rate;
}
