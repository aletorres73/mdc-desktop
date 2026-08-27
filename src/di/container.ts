import { FirestoreClientRepository } from "@/data/repositories/FirestoreClientRepository";
import { FirestoreFactoryRepository } from "@/data/repositories/FirestoreFactoryRepository";
import { FirestoreOrderRepository } from "@/data/repositories/FirestoreOrderRepository";
import { FirestoreInvoiceRepository } from "@/data/repositories/FirestoreInvoiceRepository";
import { FirestoreUserRepository } from "@/data/repositories/FirestoreUserRepository";
import { FirestoreInitRepository } from "@/data/repositories/FirestoreInitRepository";
import { FirebaseAuthRepository } from "@/data/repositories/FirebaseAuthRepository";

import { GetClientsUseCase } from "@/domain/usecases/GetClientsUseCase";
import { FactoryUseCase } from "@/domain/usecases/FactoryUseCase";
import { OrdersUseCase } from "@/domain/usecases/OrdersUseCase";
import { InvoiceUseCase } from "@/domain/usecases/InvoiceUseCase";
import { HomeUseCase } from "@/domain/usecases/HomeUseCase";
import { CommissionsUseCase } from "@/domain/usecases/CommissionsUseCase";
import { InitConfigUseCase } from "@/domain/usecases/InitConfigUseCase";
import { AuthUseCase } from "@/domain/usecases/AuthUseCase";
import { UserUseCase } from "@/domain/usecases/UserUseCase";

// Instantiate Repositories
const clientRepository = new FirestoreClientRepository();
const factoryRepository = new FirestoreFactoryRepository();
const orderRepository = new FirestoreOrderRepository();
const invoiceRepository = new FirestoreInvoiceRepository();
const userRepository = new FirestoreUserRepository();
const initRepository = new FirestoreInitRepository();
const authRepository = new FirebaseAuthRepository();

// Instantiate Use Cases (Composition Root)
export const container = {
  clientUseCase: new GetClientsUseCase(clientRepository),
  factoryUseCase: new FactoryUseCase(factoryRepository),
  ordersUseCase: new OrdersUseCase(orderRepository),
  invoiceUseCase: new InvoiceUseCase(invoiceRepository),
  homeUseCase: new HomeUseCase(factoryRepository),
  commissionsUseCase: new CommissionsUseCase(invoiceRepository, factoryRepository),
  initConfigUseCase: new InitConfigUseCase(initRepository),
  authUseCase: new AuthUseCase(authRepository),
  userUseCase: new UserUseCase(userRepository),
};

export type Container = typeof container;
