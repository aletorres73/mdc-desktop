import { FirebaseAuthRepository } from "@/data/repositories/FirebaseAuthRepository";
import { FirestoreUserRepository } from "@/data/repositories/FirestoreUserRepository";
import { FirestoreClientRepository } from "@/data/repositories/FirestoreClientRepository";
import { FirestoreFactoryRepository } from "@/data/repositories/FirestoreFactoryRepository";
import { FirestoreBuyOrderRepository } from "@/data/repositories/FirestoreBuyOrderRepository";
import { FirestoreInvoiceRepository } from "@/data/repositories/FirestoreInvoiceRepository";
import { FirestoreOrderRepository } from "@/data/repositories/FirestoreOrderRepository";
import { FirestorePaymentRegisterRepository } from "@/data/repositories/FirestorePaymentRegisterRepository";

import { AuthUseCase } from "@/domain/usecases/AuthUseCase";
import { ClientUseCase } from "@/domain/usecases/ClientUseCase";
import { FactoryUseCase } from "@/domain/usecases/FactoryUseCase";
import { BuyOrderUseCase } from "@/domain/usecases/BuyOrderUseCase";
import { OrderUseCase } from "@/domain/usecases/OrderUseCase";
import { InvoiceUseCase } from "@/domain/usecases/InvoiceUseCase";
import { PaymentRegisterUseCase } from "@/domain/usecases/PaymentRegisterUseCase";
import { CreateInvoiceFromOrderUseCase } from "@/domain/usecases/CreateInvoiceFromOrderUseCase";
import { CommissionUseCase } from "@/domain/usecases/CommissionUseCase";

// Repositories (singletons)
const authRepository = new FirebaseAuthRepository();
const userRepository = new FirestoreUserRepository();
const clientRepository = new FirestoreClientRepository();
const factoryRepository = new FirestoreFactoryRepository();
const buyOrderRepository = new FirestoreBuyOrderRepository();
const invoiceRepository = new FirestoreInvoiceRepository();
const orderRepository = new FirestoreOrderRepository();
const paymentRegisterRepository = new FirestorePaymentRegisterRepository();

// Usecases (singletons, wired with their repository dependencies)
export const authUseCase = new AuthUseCase(authRepository, userRepository);
export const clientUseCase = new ClientUseCase(clientRepository);
export const factoryUseCase = new FactoryUseCase(factoryRepository);
export const buyOrderUseCase = new BuyOrderUseCase(buyOrderRepository);
export const orderUseCase = new OrderUseCase(orderRepository);
export const invoiceUseCase = new InvoiceUseCase(invoiceRepository, factoryRepository, paymentRegisterRepository);
export const paymentRegisterUseCase = new PaymentRegisterUseCase(paymentRegisterRepository);
export const createInvoiceFromOrderUseCase = new CreateInvoiceFromOrderUseCase(
  invoiceRepository,
  buyOrderRepository,
  factoryRepository,
);
export const commissionUseCase = new CommissionUseCase(factoryRepository, invoiceRepository);

export { userRepository };
