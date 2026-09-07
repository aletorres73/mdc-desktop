import type { FactoryModel } from "@/domain/entities/factory";

export interface IFactoryRepository {
  getFactories(uid: string): Promise<FactoryModel[]>;
  getFactoryByName(uid: string, name: string): Promise<FactoryModel | null>;
  createFactory(uid: string, factory: FactoryModel): Promise<void>;
  updateFactory(uid: string, name: string, data: Partial<FactoryModel>): Promise<void>;
  deleteFactory(uid: string, name: string): Promise<void>;
}
