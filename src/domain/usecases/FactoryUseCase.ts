import type { IFactoryRepository } from "../repositories/IFactoryRepository";
import type { FactoryModel, PaymentCondition } from "../entities/factory";
import { PaymentConditionService } from "../logic/paymentConditionMapper";

export class FactoryUseCase {
  constructor(private factoryRepo: IFactoryRepository) {}

  async getAllFactories(uid: string): Promise<FactoryModel[]> {
    return this.factoryRepo.getAllFactories(uid);
  }

  async getFactoryByName(uid: string, factoryName: string): Promise<FactoryModel | null> {
    return this.factoryRepo.getFactoryByName(uid, factoryName);
  }

  async createFactory(uid: string, factory: FactoryModel): Promise<FactoryModel> {
    if (!factory.name || factory.name.trim() === "") {
      throw new Error("El nombre de la fábrica es obligatorio");
    }
    const cleanConditions = PaymentConditionService.filterValid(factory.paymentType);
    const cleanFactory = { ...factory, paymentType: cleanConditions };
    return this.factoryRepo.createFactory(uid, cleanFactory);
  }

  async updateFactory(uid: string, factory: FactoryModel): Promise<FactoryModel> {
    const cleanConditions = PaymentConditionService.filterValid(factory.paymentType);
    const cleanFactory = { ...factory, paymentType: cleanConditions };
    return this.factoryRepo.updateFactory(uid, cleanFactory);
  }

  async updatePaymentConditions(
    uid: string,
    factoryName: string,
    paymentConditions: PaymentCondition[]
  ): Promise<void> {
    const cleanConditions = PaymentConditionService.filterValid(paymentConditions);
    return this.factoryRepo.updatePaymentConditions(uid, factoryName, cleanConditions);
  }

  async deleteFactory(uid: string, factoryName: string): Promise<string> {
    return this.factoryRepo.deleteFactory(uid, factoryName);
  }
}
