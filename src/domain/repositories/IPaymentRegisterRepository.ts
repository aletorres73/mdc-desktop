import type { PaymentRegisterModel } from "@/domain/entities/paymentRegister";

export interface IPaymentRegisterRepository {
  getMovements(uid: string, filters?: { clientId?: string; branch?: string }): Promise<PaymentRegisterModel[]>;
  createMovement(uid: string, movement: PaymentRegisterModel): Promise<void>;
  updateMovement(uid: string, id: number, data: Partial<PaymentRegisterModel>): Promise<void>;
  deleteMovement(uid: string, id: number): Promise<void>;
  getNextId(uid: string): Promise<number>;
}
