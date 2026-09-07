import { describe, expect, it, vi } from "vitest";
import { AuthUseCase } from "@/domain/usecases/AuthUseCase";
import { ClientUseCase } from "@/domain/usecases/ClientUseCase";
import { recalculateBilling } from "@/domain/logic/recalculate";
import { calculateCommission, calculatePaymentCommission } from "@/domain/logic/commissionCalculator";
import { summarizeInvoice } from "@/domain/logic/invoiceSummary";
import { CommissionUseCase } from "@/domain/usecases/CommissionUseCase";

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
  const commissionFactory = {
    name: "Fábrica A",
    branchList: ["Premium"],
    paymentType: [],
    defaultCommission: 0.05,
    segmentCommissions: { Premium: 0.08 },
  };

  const commissionBilling = {
    billingNumber: "1000",
    orderId: "order-0",
    type: "Factura",
    total: 1000,
    loadDate: 0,
    deliveryDate: 0,
    payDate: 0,
    articles: [],
    paymentCondition: "",
    expectedDiscount: 0,
    toPay: 1000,
    payed: 0,
    rest: 1000,
    stateBilling: "Pendiente",
    clientId: "client-0",
    brand: "Fábrica A",
    branch: "Premium",
    comments: [],
    clientName: "Demo",
    timeStamp: 0,
  };

  it("calculates commission from a real payment and preserves the segment fallback", () => {
    const payment = {
      id: 1,
      clientId: "client-0",
      branch: "Fábrica A",
      date: 0,
      clientName: "Demo",
      documentNumber: "1000",
      type: "Factura",
      total: 210,
      notes: "",
      method: "TRANSFERENCIA" as const,
      status: "PENDIENTE" as const,
      reconciliationDate: 0,
      confirmationTimestamp: 0,
      isVirtual: false,
    };

    expect(calculatePaymentCommission(payment, commissionBilling, [commissionFactory])).toBeCloseTo(16, 5);
  });

  it("does not calculate commission for virtual movements", () => {
    const payment = {
      id: 2,
      clientId: "client-0",
      branch: "Fábrica A",
      date: 0,
      clientName: "Demo",
      documentNumber: "1000",
      type: "Factura",
      total: 210,
      notes: "",
      method: "NOTA_CREDITO" as const,
      status: "RECONCILIADO" as const,
      reconciliationDate: 0,
      confirmationTimestamp: 0,
      isVirtual: true,
    };

    expect(calculatePaymentCommission(payment, commissionBilling, [commissionFactory])).toBe(0);
  });

  it("returns one commission row per real payment, including pending and reconciled states", async () => {
    const invoiceRepository = {
      getInvoicesPage: vi.fn().mockResolvedValue({ items: [commissionBilling], nextCursor: null, quantity: 1, endReached: true }),
    };
    const paymentRepository = {
      getMovements: vi.fn().mockResolvedValue([
        {
          id: 1,
          clientId: "client-0",
          branch: "Fábrica A",
          date: 0,
          clientName: "Demo",
          documentNumber: "1000",
          type: "Factura",
          total: 100,
          notes: "",
          method: "TRANSFERENCIA",
          status: "PENDIENTE",
          reconciliationDate: 0,
          confirmationTimestamp: 0,
          isVirtual: false,
        },
        {
          id: 2,
          clientId: "client-0",
          branch: "Fábrica A",
          date: 0,
          clientName: "Demo",
          documentNumber: "1000",
          type: "Factura",
          total: 50,
          notes: "",
          method: "NOTA_CREDITO",
          status: "RECONCILIADO",
          reconciliationDate: 0,
          confirmationTimestamp: 0,
          isVirtual: true,
        },
      ]),
    };
    const useCase = new CommissionUseCase(
      { getFactories: vi.fn().mockResolvedValue([commissionFactory]) } as any,
      invoiceRepository as any,
      paymentRepository as any,
    );

    const summary = await useCase.getCommissionSummary("uid-1");

    expect(summary).toHaveLength(1);
    expect(summary[0]).toMatchObject({ paymentId: 1, paymentAmount: 100, paymentStatus: "PENDIENTE" });
  });

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

    expect(calculateCommission(billing, factories)).toBeCloseTo(66.11570247933885, 5);
  });

  it("falls back to the factory default commission when the branch has no segment override", () => {
    const factories = [
      {
        name: "Fábrica A",
        branchList: ["Premium"],
        paymentType: [{ paymentName: "Contado", discount: 0, month: 0, expiration: 15, date: 0, quantity: 1 }],
        defaultCommission: 0.05,
        segmentCommissions: { Gold: 0.08 },
      },
    ];

    const billing = {
      billingNumber: "1002",
      orderId: "order-2",
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
      clientId: "client-2",
      brand: "Fábrica A",
      branch: "Premium",
      comments: [],
      clientName: "Demo",
      timeStamp: 0,
    };

    expect(calculateCommission(billing, factories)).toBeCloseTo(41.3223148, 5);
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

  it("summarizes the invoice detail with totals and remaining balance", () => {
    const billing = {
      billingNumber: "1003",
      orderId: "order-3",
      type: "Factura",
      total: 1000,
      loadDate: 1700000000000,
      deliveryDate: 1700003600000,
      payDate: 1700090000000,
      articles: [
        { name: "Camiseta", color: "Azul", value: 600, pairs: 20 },
        { name: "Pantalón", color: "Negro", value: 400, pairs: 10 },
      ],
      paymentCondition: "Contado",
      expectedDiscount: 50,
      toPay: 950,
      payed: 350,
      rest: 600,
      stateBilling: "Pendiente",
      clientId: "client-3",
      brand: "Fábrica A",
      branch: "Premium",
      comments: [],
      clientName: "Demo",
      timeStamp: 0,
    };

    expect(summarizeInvoice(billing as any)).toEqual({
      total: 1000,
      paid: 350,
      remaining: 600,
      discount: 50,
      articleCount: 2,
    });
  });
});
