import { describe, expect, it } from "vitest";
import { billingPaymentToRegister, toPaymentRegisterDomain, toPaymentRegisterRemote } from "../../../data/mappers/paymentRegisterMapper";
import type { BillingModel } from "../../../domain/entities/invoice";

const billing: BillingModel = {
  billingNumber: "F-001", orderId: "O-001", type: "Factura", total: 100,
  loadDate: 1, deliveryDate: 2, payDate: 3, articles: [], paymentCondition: "Contado",
  expectedDiscount: 0, toPay: 100, payed: 0, rest: 100, stateBilling: "Pendiente",
  clientId: "client-1", brand: "Marca Uno", branch: "Mayorista", comments: [],
  clientName: "Cliente Uno", timeStamp: 4,
};

describe("paymentRegisterMapper", () => {
  it("maps a real payment to the Android remote contract", () => {
    const movement = billingPaymentToRegister(billing, {
      id: "payment-1", amount: 25, type: "real", status: "imputado", date: 10,
    }, 7);

    expect(movement).toMatchObject({ id: 7, method: "PAGO", status: "IMPUTADO", isVirtual: false });
    expect(toPaymentRegisterRemote(movement)["Cliente ID"]).toBe("client-1");
  });

  it("preserves virtual movement method and safely defaults unknown remote values", () => {
    const movement = billingPaymentToRegister(billing, {
      id: "payment-2", amount: 10, type: "virtual", virtualType: "nota-credito",
      status: "pendiente", date: 11,
    }, 8);
    expect(movement).toMatchObject({ method: "NOTA_CREDITO", status: "PENDIENTE", isVirtual: true });

    const domain = toPaymentRegisterDomain({
      "Pago Id": 9, "Cliente ID": "client-1", "Marca": "Marca Uno", "Fecha": 12,
      "Razón Social": "Cliente Uno", "Remito": "F-002", "Tipo": "Factura", "Monto pagado": 5,
      "Notas": "", "Metodo": "desconocido", "Estado": "", "Fecha Conciliacion": 0,
      "Fecha Confirmacion": 0, "Es Virtual": false,
    });
    expect(domain.method).toBe("PAGO");
    expect(domain.status).toBe("IMPUTADO");
  });
});