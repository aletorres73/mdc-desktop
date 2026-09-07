import { describe, expect, it, vi } from "vitest";
import { AuthUseCase } from "@/domain/usecases/AuthUseCase";
import { ClientUseCase } from "@/domain/usecases/ClientUseCase";
import { recalculateBilling } from "@/domain/logic/recalculate";
import { calculateCommission } from "@/domain/logic/commissionCalculator";

describe("ClientUseCase", () => {
  it("accepts a custom client id instead of forcing the suggested one", async () => {
    const repo = {
      getClients: vi.fn(),
      searchClientsByPrefix: vi.fn(),
      getClient: vi.fn(),
      createClient: vi.fn().mockResolvedValue(undefined),
      updateClient: vi.fn(),
      deleteClient: vi.fn(),
      suggestNextClientId: vi.fn().mockResolvedValue("42"),
    };

    const useCase = new ClientUseCase(repo as any);
    const created = await useCase.createClient("uid-1", "Demo SRL", "99");

    expect(created).toEqual({ clientId: "99", clientName: "Demo SRL" });
    expect(repo.createClient).toHaveBeenCalledWith("uid-1", { clientId: "99", clientName: "Demo SRL" });
  });
});

describe("AuthUseCase", () => {
  it("keeps access active when the user is manually enabled even if the subscription is expired", () => {
    const useCase = new AuthUseCase({} as any, {} as any);

    const active = useCase.isSubscriptionActive({
      uid: "uid-1",
      name: "Ana",
      lastName: "García",
      email: "ana@test.com",
      subscriptionExpiresAt: 0,
      isManuallyEnabled: true,
      paymentHistory: [],
    });

    expect(active).toBe(true);
  });
});

describe("Invoice business rules", () => {
  it("uses the segment commission for the selected brand before the factory default", () => {
    const factories = [
      {
        name: "Fábrica A",
        branchList: ["Premium"],
        paymentType: [{ paymentName: "Contado", discount: 0, month: 0, expiration: 15, date: 0, quantity: 1 }],
        defaultCommission: 0.05,
        segmentCommissions: { Premium: 0.08 },
      },
    ];

    const billing = {
      billingNumber: "1001",
      orderId: "order-1",
      type: "Factura",
      total: 1000,
      loadDate: 0,
      deliveryDate: 0,
      payDate: 0,
      articles: [],
      paymentCondition: "Contado",
      expectedDiscount: 0,
      toPay: 1000,
      payed: 0,
      rest: 1000,
      stateBilling: "Pendiente",
      clientId: "client-1",
      brand: "Fábrica A",
      branch: "Premium",
      comments: [],
      clientName: "Demo",
      timeStamp: 0,
    };

    expect(calculateCommission(billing, factories)).toBeCloseTo(826.446280991735, 5);
  });

  it("calculates the due date and state based on the payment condition expiration", () => {
    const factory = {
      name: "Fábrica A",
      branchList: ["Premium"],
      paymentType: [{ paymentName: "Contado", discount: 0, month: 0, expiration: 30, date: 0, quantity: 1 }],
      defaultCommission: 0.05,
      segmentCommissions: {},
    };

    const now = new Date("2026-01-15T00:00:00Z").getTime();
    const dueAt = new Date("2026-02-14T00:00:00Z").getTime();

    const billing = {
      billingNumber: "1002",
      orderId: "order-2",
      type: "Factura",
      total: 2000,
      loadDate: 0,
      deliveryDate: new Date("2026-01-15T00:00:00Z").getTime(),
      payDate: 0,
      articles: [],
      paymentCondition: "Contado",
      expectedDiscount: 0,
      toPay: 2000,
      payed: 0,
      rest: 2000,
      stateBilling: "Pendiente",
      clientId: "client-2",
      brand: "Fábrica A",
      branch: "Premium",
      comments: [],
      clientName: "Demo",
      timeStamp: 0,
    };

    const recalculated = recalculateBilling(billing, factory, now);

    expect(recalculated.payDate).toBe(dueAt);
    expect(recalculated.stateBilling).toBe("Pendiente");
  });
});
