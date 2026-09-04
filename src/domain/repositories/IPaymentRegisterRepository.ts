import type { MovementStatus, PaymentRegisterModel } from "../entities/paymentRegister";

export interface PaymentRegisterFilters { clientId?: string; branch?: string; }

export interface IPaymentRegisterRepository {
  getAll(uid: string, filters?: PaymentRegisterFilters): Promise<PaymentRegisterModel[]>;
  getLastId(uid: string): Promise<number>;
  save(uid: string, payment: PaymentRegisterModel): Promise<void>;
  updateStatus(uid: string, paymentId: number, status: MovementStatus, date: number): Promise<void>;
  delete(uid: string, paymentId: number): Promise<void>;
}