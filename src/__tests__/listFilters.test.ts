import { describe, expect, it } from "vitest";
import {
  buildSegmentByDocument,
  filterMovements,
  matchesMovementSearch,
  EMPTY_MOVEMENT_FILTERS,
} from "@/domain/logic/paymentRegisterList";
import { filterBuyOrders, matchesBuyOrderSearch, sortBuyOrdersByRecency } from "@/domain/logic/buyOrderList";
import type { PaymentRegisterModel } from "@/domain/entities/paymentRegister";
import type { BuyOrderModel } from "@/domain/entities/buyOrder";

const movement = (overrides: Partial<PaymentRegisterModel>): PaymentRegisterModel => ({
  id: 1,
  clientId: "1",
  branch: "Fábrica A",
  date: 0,
  clientName: "Kiosco El Sol",
  documentNumber: "R-1001",
  type: "Remito",
  total: 1000,
  notes: "",
  method: "TRANSFERENCIA",
  status: "PENDIENTE",
  reconciliationDate: 0,
  confirmationTimestamp: 0,
  isVirtual: false,
  ...overrides,
});

const order = (overrides: Partial<BuyOrderModel>): BuyOrderModel => ({
  id: "3",
  clientId: "1",
  order: "3",
  client: "Kiosco El Sol",
  factory: "Fábrica A",
  branch: "Premium",
  deliveryDate: 0,
  type: "Pedido",
  billing: "",
  comments: "",
  articles: [],
  loadedDate: 0,
  paymentCondition: "",
  discount: 0,
  expirationDays: 0,
  timeStamp: 100,
  ...overrides,
});

describe("paymentRegisterList filters", () => {
  const movements = [
    movement({ id: 1, clientName: "Kiosco El Sol", documentNumber: "R-1001", method: "EFECTIVO", status: "PENDIENTE", branch: "Fábrica A" }),
    movement({ id: 2, clientName: "Almacén Luna", documentNumber: "F-2002", method: "TRANSFERENCIA", status: "RECONCILIADO", branch: "Fábrica B" }),
  ];

  it("matches search by razón social or document number, case-insensitive", () => {
    expect(matchesMovementSearch(movements[0], "kiosco")).toBe(true);
    expect(matchesMovementSearch(movements[1], "f-2002")).toBe(true);
    expect(matchesMovementSearch(movements[0], "luna")).toBe(false);
  });

  it("filters by method, status and factory", () => {
    expect(filterMovements(movements, { ...EMPTY_MOVEMENT_FILTERS, method: "EFECTIVO" })).toHaveLength(1);
    expect(filterMovements(movements, { ...EMPTY_MOVEMENT_FILTERS, status: "RECONCILIADO" })).toHaveLength(1);
    expect(filterMovements(movements, { ...EMPTY_MOVEMENT_FILTERS, factory: "Fábrica B" })[0]?.id).toBe(2);
  });

  it("filters by segment resolved from the associated invoice", () => {
    const segmentByDocument = buildSegmentByDocument([
      { billingNumber: "R-1001", branch: "Premium" },
      { billingNumber: "F-2002", branch: "Económico" },
    ]);
    const result = filterMovements(movements, { ...EMPTY_MOVEMENT_FILTERS, segment: "Premium" }, segmentByDocument);
    expect(result.map((m) => m.id)).toEqual([1]);
  });

  it("excludes movements without invoice when a segment filter is active", () => {
    const result = filterMovements(movements, { ...EMPTY_MOVEMENT_FILTERS, segment: "Premium" }, new Map());
    expect(result).toHaveLength(0);
  });
});

describe("buyOrderList filters", () => {
  const orders = [
    order({ id: "3", order: "3", client: "Kiosco El Sol", factory: "Fábrica A", branch: "Premium", timeStamp: 100 }),
    order({ id: "7", order: "7", client: "Almacén Luna", factory: "Fábrica B", branch: "Económico", timeStamp: 200 }),
  ];

  it("matches search by client name or order number", () => {
    expect(matchesBuyOrderSearch(orders[0], "sol")).toBe(true);
    expect(matchesBuyOrderSearch(orders[1], "7")).toBe(true);
    expect(matchesBuyOrderSearch(orders[0], "luna")).toBe(false);
  });

  it("filters by factory and branch", () => {
    expect(filterBuyOrders(orders, { search: "", factory: "Fábrica A", branch: "" })).toHaveLength(1);
    expect(filterBuyOrders(orders, { search: "", factory: "", branch: "Económico" })[0]?.id).toBe("7");
    expect(filterBuyOrders(orders, { search: "luna", factory: "Fábrica A", branch: "" })).toHaveLength(0);
  });

  it("sorts by recency without mutating the input", () => {
    const sorted = sortBuyOrdersByRecency(orders);
    expect(sorted.map((o) => o.id)).toEqual(["7", "3"]);
    expect(orders.map((o) => o.id)).toEqual(["3", "7"]);
  });
});
