import { describe, it, expect } from "vitest";
import { CommissionCalculator } from "../../../domain/logic/commissionCalculator";
import { FIXTURES, createInvoice, createFactory } from "../../fixtures";

describe("CommissionCalculator", () => {
  describe("Cálculo básico de comisiones", () => {
    it("debe calcular comisión usando la tasa por defecto de la fábrica", () => {
      const factory = FIXTURES.factories.standard;
      const amount = 1000;
      const config = { deductIVA: false, ivaRate: 0.21 }; // Sin deducir IVA para test simple
      const commission = CommissionCalculator.calculate(
        amount,
        factory,
        "General",
        "Factura",
        config
      );

      // 1000 * 5.5 / 100 = 55
      expect(commission).toBeCloseTo(55, 2);
    });

    it("debe usar tasa de segmento cuando existe", () => {
      const factory = FIXTURES.factories.standard;
      const amount = 1000;
      const config = { deductIVA: false, ivaRate: 0.21 };
      const commission = CommissionCalculator.calculate(
        amount,
        factory,
        "Deportivo", // Existe en segmentCommissions
        "Factura",
        config
      );

      // 1000 * 5.5 / 100 = 55 (Deportivo tiene 5.5%)
      expect(commission).toBeCloseTo(55, 2);
    });

    it("debe usar tasa de segmento diferente cuando la hay", () => {
      const factory = FIXTURES.factories.standard;
      const amount = 1000;
      const config = { deductIVA: false, ivaRate: 0.21 };
      const commission = CommissionCalculator.calculate(
        amount,
        factory,
        "Formal", // Formal tiene 7%
        "Factura",
        config
      );

      // 1000 * 7.0 / 100 = 70
      expect(commission).toBeCloseTo(70, 2);
    });

    it("debe retornar 0 cuando la tasa de comisión es <= 0", () => {
      const factory = createFactory({ defaultCommission: 0 });
      const commission = CommissionCalculator.calculate(
        1000,
        factory,
        "General",
        "Factura"
      );

      expect(commission).toBe(0);
    });
  });

  describe("Deducción de IVA para facturas", () => {
    it("debe deducir IVA (21%) cuando deductIVA es true para Factura", () => {
      const factory = FIXTURES.factories.standard;
      const amount = 1210; // 1000 + 21% IVA
      const config = { deductIVA: true, ivaRate: 0.21 };

      const commission = CommissionCalculator.calculate(
        amount,
        factory,
        "General",
        "Factura",
        config
      );

      // Base sin IVA: 1210 / 1.21 = 1000
      // Comisión: 1000 * 5.5 / 100 = 55
      expect(commission).toBeCloseTo(55, 2);
    });

    it("no debe deducir IVA cuando deductIVA es false", () => {
      const factory = FIXTURES.factories.standard;
      const amount = 1210; // 1000 + 21% IVA
      const config = { deductIVA: false, ivaRate: 0.21 };

      const commission = CommissionCalculator.calculate(
        amount,
        factory,
        "General",
        "Factura",
        config
      );

      // Comisión: 1210 * 5.5 / 100 = 66.55
      expect(commission).toBeCloseTo(66.55, 2);
    });

    it("no debe deducir IVA para documentos que no sean Factura", () => {
      const factory = FIXTURES.factories.standard;
      const amount = 1210;
      const config = { deductIVA: true, ivaRate: 0.21 };

      const commission = CommissionCalculator.calculate(
        amount,
        factory,
        "General",
        "Remito", // No es Factura
        config
      );

      // Aunque deductIVA es true, no se aplica para Remito
      // Comisión: 1210 * 5.5 / 100 = 66.55
      expect(commission).toBeCloseTo(66.55, 2);
    });

    it("debe ser case-insensitive al detectar Factura", () => {
      const factory = FIXTURES.factories.standard;
      const amount = 1210;
      const config = { deductIVA: true, ivaRate: 0.21 };

      const commission1 = CommissionCalculator.calculate(
        amount,
        factory,
        "General",
        "factura", // minúscula
        config
      );

      const commission2 = CommissionCalculator.calculate(
        amount,
        factory,
        "General",
        "FACTURA", // mayúscula
        config
      );

      expect(commission1).toBeCloseTo(55, 2);
      expect(commission2).toBeCloseTo(55, 2);
    });
  });

  describe("Resumen de comisiones desde facturas", () => {
    it("debe agrupar facturas por fábrica", () => {
      const billings = [
        FIXTURES.invoices.pending,
        FIXTURES.invoices.partialPayment,
      ];
      const factories = [FIXTURES.factories.standard];

      const summaries = CommissionCalculator.calculateCommissionsFromBillings(
        billings,
        factories
      );

      expect(summaries).toHaveLength(1);
      expect(summaries[0].factoryName).toBe("Fábrica Estándar");
    });

    it("debe calcular total recolectado de facturas pagadas", () => {
      const billings = [
        createInvoice({
          brand: "Fábrica Estándar",
          total: 10000,
          payed: 0,
        }),
        createInvoice({
          brand: "Fábrica Estándar",
          total: 5000,
          payed: 5000,
        }),
      ];
      const factories = [FIXTURES.factories.standard];

      const summaries = CommissionCalculator.calculateCommissionsFromBillings(
        billings,
        factories
      );

      const summary = summaries[0];
      // Primera: payed=0 entonces usa total=10000
      // Segunda: payed=5000
      // Total: 10000 + 5000 = 15000
      expect(summary.totalCollected).toBe(15000);
    });

    it("debe usar payed cuando es > 0, sino total", () => {
      const billings = [
        createInvoice({
          brand: "Fábrica Estándar",
          total: 10000,
          payed: 3000, // Usa payed
        }),
        createInvoice({
          brand: "Fábrica Estándar",
          total: 5000,
          payed: 0, // Usa total
        }),
      ];
      const factories = [FIXTURES.factories.standard];

      const summaries = CommissionCalculator.calculateCommissionsFromBillings(
        billings,
        factories
      );

      const summary = summaries[0];
      // 3000 + 5000 = 8000
      expect(summary.totalCollected).toBe(8000);
    });

    it("debe calcular comisiones totales correctamente", () => {
      const billings = [
        createInvoice({
          brand: "Fábrica Estándar",
          branch: "General",
          total: 1000,
          toPay: 1000,
          payed: 0,
          type: "Factura",
        }),
      ];
      const factories = [FIXTURES.factories.standard];
      const config = { deductIVA: false, ivaRate: 0.21 };

      const summaries = CommissionCalculator.calculateCommissionsFromBillings(
        billings,
        factories,
        config
      );

      const summary = summaries[0];
      // 1000 * 5.5% / 100 = 55
      expect(summary.totalCommissionEarned).toBeCloseTo(55, 2);
    });

    it("debe desglosar comisiones por segmento", () => {
      const billings = [
        createInvoice({
          brand: "Fábrica Estándar",
          branch: "Casual",
          total: 1000,
          toPay: 1000,
          payed: 0,
          type: "Factura",
        }),
        createInvoice({
          brand: "Fábrica Estándar",
          branch: "Formal",
          total: 1000,
          toPay: 1000,
          payed: 0,
          type: "Factura",
        }),
      ];
      const factories = [FIXTURES.factories.standard];
      const config = { deductIVA: false, ivaRate: 0.21 };

      const summaries = CommissionCalculator.calculateCommissionsFromBillings(
        billings,
        factories,
        config
      );

      const summary = summaries[0];
      expect(summary.segmentBreakdown["Casual"]).toBeDefined();
      expect(summary.segmentBreakdown["Formal"]).toBeDefined();

      // Casual: 1000 * 6% / 100 = 60
      expect(summary.segmentBreakdown["Casual"].commission).toBeCloseTo(60, 2);
      // Formal: 1000 * 7% / 100 = 70
      expect(summary.segmentBreakdown["Formal"].commission).toBeCloseTo(70, 2);
    });

    it("debe ignorar facturas de fábricas no encontradas", () => {
      const billings = [
        createInvoice({
          brand: "Fábrica Estándar",
          total: 1000,
          payed: 0,
        }),
        createInvoice({
          brand: "Unknown Brand", // No existe
          total: 5000,
          payed: 0,
        }),
      ];
      const factories = [FIXTURES.factories.standard];

      const summaries = CommissionCalculator.calculateCommissionsFromBillings(
        billings,
        factories
      );

      // Solo se procesa la primera factura
      expect(summaries[0].totalCollected).toBe(1000);
    });

    it("debe usar el defaultCommission cuando branch no existe en segmentCommissions", () => {
      const billings = [
        createInvoice({
          brand: "Fábrica Estándar",
          branch: "UnknownSegment", // No existe
          total: 1000,
          toPay: 1000,
          payed: 0,
          type: "Factura",
        }),
      ];
      const factories = [FIXTURES.factories.standard];
      const config = { deductIVA: false, ivaRate: 0.21 };

      const summaries = CommissionCalculator.calculateCommissionsFromBillings(
        billings,
        factories,
        config
      );

      const summary = summaries[0];
      // Debe usar defaultCommission = 5.5%
      // 1000 * 5.5 / 100 = 55
      expect(summary.segmentBreakdown["UnknownSegment"].commission).toBeCloseTo(55, 2);
    });

    it("debe manejar múltiples fábricas correctamente", () => {
      const billings = [
        createInvoice({
          brand: "Fábrica Estándar",
          branch: "General",
          total: 1000,
          toPay: 1000,
          payed: 0,
          type: "Factura",
        }),
        createInvoice({
            brand: "Fábrica Premium",
          branch: "General",
          total: 1000,
          toPay: 1000,
          payed: 0,
          type: "Factura",
        }),
      ];
      const factories = [
        FIXTURES.factories.standard,
        FIXTURES.factories.premium,
      ];
      const config = { deductIVA: false, ivaRate: 0.21 };

      const summaries = CommissionCalculator.calculateCommissionsFromBillings(
        billings,
        factories,
        config
      );

      expect(summaries).toHaveLength(2);
      // Standard: 1000 * 5.5% = 55
      expect(summaries[0].totalCommissionEarned).toBeCloseTo(55, 2);
      // Premium: 1000 * 8% = 80
      expect(summaries[1].totalCommissionEarned).toBeCloseTo(80, 2);
    });
  });

  describe("Casos complejos del mundo real", () => {
    it("escenario: factura con IVA y segmento premium", () => {
      const factory = FIXTURES.factories.standard;
      const amountWithVAT = 1210; // 1000 + 21% IVA
      const config = { deductIVA: true, ivaRate: 0.21 };

      const commission = CommissionCalculator.calculate(
        amountWithVAT,
        factory,
        "Formal", // 7% segmento premium
        "Factura",
        config
      );

      // Base: 1210 / 1.21 = 1000
      // Comisión: 1000 * 7% / 100 = 70
      expect(commission).toBeCloseTo(70, 2);
    });

    it("escenario: resumen de facturas mezcladas", () => {
      const billings = [
        FIXTURES.invoices.pending,
        FIXTURES.invoices.partialPayment,
        FIXTURES.invoices.fullPayment,
        FIXTURES.invoices.withDiscount,
      ];
      const factories = [FIXTURES.factories.standard];

      const summaries = CommissionCalculator.calculateCommissionsFromBillings(
        billings,
        factories
      );

      expect(summaries).toHaveLength(1);
      const summary = summaries[0];
      expect(summary.totalCollected).toBeGreaterThan(0);
      expect(summary.totalCommissionEarned).toBeGreaterThan(0);
    });
  });
});

