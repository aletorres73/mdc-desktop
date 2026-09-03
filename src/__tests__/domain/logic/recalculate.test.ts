import { describe, it, expect } from "vitest";
import { recalculateBilling } from "../../../domain/logic/recalculate";
import { FIXTURES, getPastDate, getFutureDate, createInvoice, createPaymentCondition } from "../../fixtures";

describe("recalculateBilling", () => {
  describe("Cálculo de saldo", () => {
    it("debe calcular el saldo como montoACobrar - totalPagado", () => {
      const invoice = createInvoice({
        total: 10000,
        toPay: 10000,
        payed: 3000,
      });

      const result = recalculateBilling(invoice);

      expect(result.toPay).toBe(10000);
      expect(result.rest).toBe(7000); // 10000 - 3000
    });

    it("debe tener saldo 0 cuando está completamente pagado", () => {
      const invoice = createInvoice({
        total: 5000,
        toPay: 5000,
        payed: 5000,
      });

      const result = recalculateBilling(invoice);

      expect(result.rest).toBe(0);
    });

    it("debe permitir saldo negativo (pago en exceso)", () => {
      const invoice = createInvoice({
        total: 5000,
        toPay: 5000,
        payed: 6000,
      });

      const result = recalculateBilling(invoice);

      expect(result.rest).toBe(-1000);
    });
  });

  describe("Cálculo de vencimiento", () => {
    it("debe calcular fecha de pago usando deliveryDate + condition.expiration", () => {
      const deliveryDate = getPastDate(10); // 10 días atrás
      const condition = FIXTURES.factories.standard.paymentType?.[2]; // 30 días
      const expectedPayDate = deliveryDate + 30 * 86400000;

      const invoice = createInvoice({
        deliveryDate,
        paymentCondition: "30 días",
      });

      const result = recalculateBilling(invoice, condition);

      expect(result.payDate).toBe(expectedPayDate);
    });

    it("debe mantener payDate en 0 cuando no hay condición de pago", () => {
      const invoice = createInvoice({
        deliveryDate: getPastDate(10),
        paymentCondition: undefined,
        payDate: 0,
      });

      const result = recalculateBilling(invoice);

      expect(result.payDate).toBe(0);
    });

    it("debe mantener payDate en 0 cuando deliveryDate es 0", () => {
      const condition = createPaymentCondition(15, "15 días");
      const invoice = createInvoice({
        deliveryDate: 0,
        paymentCondition: "15 días",
      });

      const result = recalculateBilling(invoice, condition);

      expect(result.payDate).toBe(0);
    });

    it("debe calcular correctamente contado (0 días de vencimiento)", () => {
      const deliveryDate = getPastDate(5);
      const condition = createPaymentCondition(0, "Contado");
      const expectedPayDate = deliveryDate + 0 * 86400000;

      const invoice = createInvoice({
        deliveryDate,
        paymentCondition: "Contado",
      });

      const result = recalculateBilling(invoice, condition);

      expect(result.payDate).toBe(expectedPayDate);
    });
  });

  describe("Estado de factura", () => {
    it("debe marcar como Cobrado cuando rest <= 0 y total > 0", () => {
      const invoice = createInvoice({
        total: 5000,
        toPay: 5000,
        payed: 5000,
        stateBilling: "Pendiente",
      });

      const result = recalculateBilling(invoice);

      expect(result.stateBilling).toBe("Cobrado");
    });

    it("debe marcar como Vencido cuando payDate es pasado y rest > 0", () => {
      const payDate = getPastDate(5); // 5 días atrás
      const invoice = createInvoice({
        total: 10000,
        payed: 0,
        rest: 10000,
        payDate,
        stateBilling: "Pendiente",
      });

      const result = recalculateBilling(invoice);

      expect(result.stateBilling).toBe("Vencido");
    });

    it("debe marcar como Por vencer cuando quedan <= 1 día y rest > 0", () => {
      // Fecha de pago: hoy a las 12:00 (menos de 1 día desde medianoche)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayMillis = today.getTime();
      const payDate = todayMillis + 12 * 60 * 60 * 1000; // Hoy a las 12:00

      const invoice = createInvoice({
        total: 10000,
        toPay: 10000,
        deliveryDate: todayMillis - 2 * 24 * 60 * 60 * 1000,
        payDate,
        payed: 0,
        rest: 10000,
        paymentCondition: "15 días",
        stateBilling: "Pendiente",
      });

      const result = recalculateBilling(invoice);

      expect(result.stateBilling).toBe("Por vencer");
    });

    it("debe marcar como Pendiente cuando faltan > 1 día y rest > 0", () => {
      const payDate = getFutureDate(15); // 15 días en el futuro
      const invoice = createInvoice({
        total: 10000,
        payed: 0,
        rest: 10000,
        payDate,
        stateBilling: "Pendiente",
      });

      const result = recalculateBilling(invoice);

      expect(result.stateBilling).toBe("Pendiente");
    });

    it("debe mantener estados finales (Cerrada, Devuelta, Cancelado)", () => {
      const statuses = ["Cerrada", "Devuelta", "Cancelado"] as const;

      statuses.forEach((status) => {
        const invoice = createInvoice({
          stateBilling: status,
        });

        const result = recalculateBilling(invoice);

        expect(result.stateBilling).toBe(status);
      });
    });

    it("debe marcar como Pendiente cuando hay pago parcial sin payDate", () => {
      const invoice = createInvoice({
        total: 10000,
        payed: 3000,
        rest: 7000,
        payDate: 0,
      });

      const result = recalculateBilling(invoice);

      expect(result.stateBilling).toBe("Pendiente");
    });

    it("debe marcar como Pendiente cuando no hay información de vencimiento", () => {
      const invoice = createInvoice({
        total: 5000,
        payed: 0,
        rest: 5000,
        payDate: 0,
        paymentCondition: undefined,
      });

      const result = recalculateBilling(invoice);

      expect(result.stateBilling).toBe("Pendiente");
    });
  });

  describe("Casos complejos", () => {
    it("escenario real: factura reciente, sin pago, 15 días", () => {
      const deliveryDate = getPastDate(2);
      const condition = createPaymentCondition(15, "15 días");
      const expectedPayDate = deliveryDate + 15 * 86400000;

      const invoice = createInvoice({
        billingNumber: "FAC-001",
        total: 10000,
        deliveryDate,
        payed: 0,
        stateBilling: "Pendiente",
        paymentCondition: "15 días",
      });

      const result = recalculateBilling(invoice, condition);

      expect(result.toPay).toBe(10000);
      expect(result.rest).toBe(10000);
      expect(result.payDate).toBe(expectedPayDate);
      expect(result.stateBilling).toBe("Pendiente");
    });

    it("escenario real: factura con pago parcial vencida", () => {
      const deliveryDate = getPastDate(20);
      const payDate = getPastDate(5); // Ya vencida hace 5 días
      const invoice = createInvoice({
        billingNumber: "FAC-002",
        total: 10000,
        deliveryDate,
        payed: 3000,
        payDate,
        stateBilling: "Vencido",
      });

      const result = recalculateBilling(invoice);

      expect(result.rest).toBe(7000); // 10000 - 3000
      expect(result.stateBilling).toBe("Vencido");
    });

    it("escenario real: descuento por pronto pago aplicado", () => {
      const invoice = createInvoice({
        billingNumber: "FAC-004",
        total: 8000,
        toPay: 7600, // 8000 con 5% descuento
        payed: 7600,
        expectedDiscount: 5,
      });

      const result = recalculateBilling(invoice);

      expect(result.toPay).toBe(7600);
      expect(result.rest).toBe(0); // Completamente pagado con descuento
      expect(result.stateBilling).toBe("Cobrado");
    });
  });

  describe("Casos límite", () => {
    it("debe manejar factura con total 0", () => {
      const invoice = createInvoice({
        total: 0,
        payed: 0,
        rest: 0,
      });

      const result = recalculateBilling(invoice);

      expect(result.stateBilling).not.toBe("Cobrado"); // total 0 no es cobrado
    });

    it("debe manejar timestamps muy cercanos a la medianoche", () => {
      // Fecha en milisegundos justo antes de hoy + 24h
      const almostTomorrow = Date.now() + 86400000 - 1000;
      const invoice = createInvoice({
        total: 10000,
        payed: 0,
        rest: 10000,
        payDate: almostTomorrow,
      });

      const result = recalculateBilling(invoice);

      // Dependerá del cálculo exacto en la función
      expect(result.stateBilling).toMatch(/Pendiente|Por vencer/);
    });
  });
});
