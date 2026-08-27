import type { FactoryModel, PaymentCondition } from "../entities/factory";

export interface IFactoryRepository {
  getAllFactories(uid: string): Promise<FactoryModel[]>;
  getFactoryByName(uid: string, factoryName: string): Promise<FactoryModel | null>;
  createFactory(uid: string, factory: FactoryModel): Promise<FactoryModel>;
  updateFactory(uid: string, factory: FactoryModel): Promise<FactoryModel>;
  updatePaymentConditions(
    uid: string,
    factoryName: string,
    paymentConditions: PaymentCondition[]
  ): Promise<void>;
  deleteFactory(uid: string, factoryName: string): Promise<string>;
}
