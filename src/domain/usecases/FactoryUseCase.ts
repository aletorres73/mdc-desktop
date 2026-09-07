import type { IFactoryRepository } from "@/domain/repositories/IFactoryRepository";
import type { FactoryModel } from "@/domain/entities/factory";

export class FactoryUseCase {
  constructor(private factoryRepo: IFactoryRepository) {}

  getFactories(uid: string): Promise<FactoryModel[]> {
    return this.factoryRepo.getFactories(uid);
  }

  getFactoryByName(uid: string, name: string): Promise<FactoryModel | null> {
    return this.factoryRepo.getFactoryByName(uid, name);
  }

  createFactory(uid: string, factory: FactoryModel): Promise<void> {
    return this.factoryRepo.createFactory(uid, factory);
  }

  updateFactory(uid: string, name: string, data: Partial<FactoryModel>): Promise<void> {
    return this.factoryRepo.updateFactory(uid, name, data);
  }

  deleteFactory(uid: string, name: string): Promise<void> {
    return this.factoryRepo.deleteFactory(uid, name);
  }
}
