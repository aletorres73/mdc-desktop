import type { BillingModel, BillingPayment } from "../entities/invoice";
import type { PaymentRegisterFilters, IPaymentRegisterRepository } from "../repositories/IPaymentRegisterRepository";
import { billingPaymentToRegister } from "@/data/mappers/paymentRegisterMapper";

export class PaymentRegisterUseCase {
  constructor(private paymentRepo: IPaymentRegisterRepository) {}
  async getPayments(uid: string, filters?: PaymentRegisterFilters) { return this.paymentRepo.getAll(uid, filters); }
  async registerPayment(uid: string, billing: BillingModel, payment: BillingPayment): Promise<void> {
    const id = (await this.paymentRepo.getLastId(uid)) + 1;
    await this.paymentRepo.save(uid, billingPaymentToRegister(billing, payment, id));
  }
}