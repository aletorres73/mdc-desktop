import type { IPaymentRegisterRepository } from "@/domain/repositories/IPaymentRegisterRepository";
import type { PaymentRegisterModel, MovementMethod } from "@/domain/entities/paymentRegister";
import { VIRTUAL_MOVEMENT_METHODS } from "@/domain/entities/paymentRegister";

export class PaymentRegisterUseCase {
  constructor(private repo: IPaymentRegisterRepository) {}

  getMovements(uid: string, filters?: { clientId?: string; branch?: string }): Promise<PaymentRegisterModel[]> {
    return this.repo.getMovements(uid, filters);
  }

  isVirtual(method: MovementMethod): boolean {
    return VIRTUAL_MOVEMENT_METHODS.includes(method);
  }

  async registerMovement(
    uid: string,
    input: Omit<PaymentRegisterModel, "id" | "isVirtual" | "status" | "reconciliationDate" | "confirmationTimestamp">,
  ): Promise<PaymentRegisterModel> {
    const id = await this.repo.getNextId(uid);
    const movement: PaymentRegisterModel = {
      ...input,
      id,
      isVirtual: this.isVirtual(input.method),
      status: "PENDIENTE",
      reconciliationDate: 0,
      confirmationTimestamp: Date.now(),
    };
    await this.repo.createMovement(uid, movement);
    return movement;
  }

  async reconcileMovement(uid: string, id: number): Promise<void> {
    await this.repo.updateMovement(uid, id, {
      status: "RECONCILIADO",
      reconciliationDate: Date.now(),
    });
  }

  deleteMovement(uid: string, id: number): Promise<void> {
    return this.repo.deleteMovement(uid, id);
  }
}
