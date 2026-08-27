import type { IFactoryRepository } from "../repositories/IFactoryRepository";
import type { FactoryModel } from "../entities/factory";

export interface DashboardStats {
  totalFactories: number;
  totalBrands: number;
  averageCommission: number;
  factories: FactoryModel[];
}

export class HomeUseCase {
  constructor(private factoryRepo: IFactoryRepository) {}

  async getDashboardStats(uid: string): Promise<DashboardStats> {
    const factories = await this.factoryRepo.getAllFactories(uid);

    const totalFactories = factories.length;
    const allBrands = new Set<string>();
    let commissionSum = 0;

    factories.forEach((f) => {
      (f.branchList || []).forEach((b) => allBrands.add(b));
      commissionSum += f.defaultCommission || 0;
    });

    const averageCommission = totalFactories > 0 ? commissionSum / totalFactories : 0;

    return {
      totalFactories,
      totalBrands: allBrands.size,
      averageCommission: Math.round(averageCommission * 10) / 10,
      factories,
    };
  }
}
