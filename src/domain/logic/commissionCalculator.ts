import type { FactoryModel, CommissionConfig } from "@/domain/entities/factory";
import type { BillingModel } from "@/domain/entities/billing";

const DEFAULT_CONFIG: CommissionConfig = { deductIVA: true, ivaRate: 0.21 };

export function resolveCommissionRate(factory: FactoryModel, branch?: string): number {
  if (!factory) return 0;

  const normalizedBranch = branch?.trim();
  if (normalizedBranch) {
    const matchingSegment = Object.entries(factory.segmentCommissions ?? {}).find(([segmentName]) => {
      return segmentName.trim().toLowerCase() === normalizedBranch.toLowerCase();
    });

    if (matchingSegment) {
      return matchingSegment[1];
    }
  }

  return factory.defaultCommission ?? 0;
}

/**
 * Calcula comisión de una factura: prioriza la tasa por segmento sobre la global de fábrica,
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

  const rate = resolveCommissionRate(factory, billing.branch);
  const typeName = billing.type?.toLowerCase() ?? "";

  let base = billing.total;
  if (config.deductIVA && typeName.includes("factura")) {
    base = base / (1 + config.ivaRate);
  }

  return base * rate;
}
