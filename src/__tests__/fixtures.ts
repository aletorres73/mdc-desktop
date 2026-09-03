import type { BillingModel } from "../domain/entities/invoice";
import type { FactoryModel, PaymentCondition } from "../domain/entities/factory";
import type { ClientModel } from "../domain/entities/client";

/**
 * Fixtures compartidos para tests
 * Representan escenarios reales de la aplicación
 */

export const FIXTURES = {
  // Estados de usuario
  users: {
    activeUser: {
      uid: "user-active-001",
      isManuallyEnabled: true,
      subscriptionExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 días en el futuro
    },
    expiredUser: {
      uid: "user-expired-001",
      isManuallyEnabled: false,
      subscriptionExpiresAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 días en el pasado
    },
    manuallyEnabledExpiredSubscription: {
      uid: "user-manual-002",
      isManuallyEnabled: true,
      subscriptionExpiresAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // Expirado pero habilitado manualmente
    },
  },

  // Fábricas y comisiones
  factories: {
    standard: {
      name: "Fábrica Estándar",
      branchList: ["Casual", "Deportivo", "Formal"],
      defaultCommission: 5.5,
      segmentCommissions: {
        Casual: 6.0,
        Deportivo: 5.5,
        Formal: 7.0,
      },
      paymentType: [
        { paymentName: "Contado", discount: 0, month: 0, expiration: 0, date: 0, quantity: 1 },
        { paymentName: "15 días", discount: 0, month: 0, expiration: 15, date: 0, quantity: 1 },
        { paymentName: "30 días", discount: 0, month: 0, expiration: 30, date: 0, quantity: 1 },
        { paymentName: "45 días", discount: 0, month: 0, expiration: 45, date: 0, quantity: 1 },
      ],
    } as FactoryModel,
    premium: {
      name: "Fábrica Premium",
      branchList: ["Lujo", "Premium"],
      defaultCommission: 8.0,
      segmentCommissions: {
        Lujo: 10.0,
        Premium: 8.5,
      },
      paymentType: [
        { paymentName: "Contado", discount: 0, month: 0, expiration: 0, date: 0, quantity: 1 },
        { paymentName: "30 días", discount: 0, month: 0, expiration: 30, date: 0, quantity: 1 },
      ],
    } as FactoryModel,
  },

  // Clientes
  clients: {
    standard: {
      clientId: "client-001",
      clientName: "Zapatería XYZ S.A.",
      fantasyName: "XYZ Shoes",
      cuit: "30-12345678-9",
      address: "Av. Principal 123",
      city: "Buenos Aires",
      taxAddress: "Av. Principal 123",
      email: "info@xyzshoes.com.ar",
      phone: "+54-11-1234-5678",
      contactName: "Juan Pérez",
      deliveryTime: "9:00 - 18:00",
    } as ClientModel,
  },

  // Facturas con múltiples estados (brand = factory.name)
  invoices: {
    // Factura reciente sin pago (Pendiente)
    pending: {
      billingNumber: "FAC-001",
      orderId: "order-001",
      type: "Factura",
      total: 10000,
      loadDate: Date.now() - 2 * 24 * 60 * 60 * 1000,
      deliveryDate: Date.now() - 2 * 24 * 60 * 60 * 1000,
      payDate: Date.now() + 13 * 24 * 60 * 60 * 1000, // Vence en 13 días
      articles: [
        { name: "Zapato Deportivo", color: "Negro", value: 500, pairs: 10 },
        { name: "Zapato Casual", color: "Blanco", value: 500, pairs: 10 },
      ],
      paymentCondition: "15 días",
      expectedDiscount: 0,
      toPay: 10000,
      payed: 0,
      rest: 10000,
      stateBilling: "Pendiente",
      clientId: "client-001",
      brand: "Fábrica Estándar",
      branch: "Casual",
      comments: [],
      clientName: "Zapatería XYZ S.A.",
      timeStamp: Date.now(),
    } as BillingModel,

    // Factura con pago parcial (Pendiente - vencida)
    partialPayment: {
      billingNumber: "FAC-002",
      orderId: "order-002",
      type: "Factura",
      total: 10000,
      loadDate: Date.now() - 20 * 24 * 60 * 60 * 1000,
      deliveryDate: Date.now() - 20 * 24 * 60 * 60 * 1000,
      payDate: Date.now() - 5 * 24 * 60 * 60 * 1000, // Vencida hace 5 días
      articles: [
        { name: "Zapato Deportivo", color: "Negro", value: 500, pairs: 10 },
        { name: "Zapato Casual", color: "Blanco", value: 500, pairs: 10 },
      ],
      paymentCondition: "15 días",
      expectedDiscount: 2,
      toPay: 10000,
      payed: 3000, // Pagado 30%
      rest: 7000, // Saldo pendiente
      stateBilling: "Vencido",
      clientId: "client-001",
      brand: "Fábrica Estándar",
      branch: "Casual",
      comments: [{ comments: "Pago parcial realizado el 2025-08-15", date: Date.now() - 5 * 24 * 60 * 60 * 1000 }],
      clientName: "Zapatería XYZ S.A.",
      timeStamp: Date.now(),
    } as BillingModel,

    // Factura completamente pagada (Cobrado)
    fullPayment: {
      billingNumber: "FAC-003",
      orderId: "order-001",
      type: "Factura",
      total: 5000,
      loadDate: Date.now() - 40 * 24 * 60 * 60 * 1000,
      deliveryDate: Date.now() - 40 * 24 * 60 * 60 * 1000,
      payDate: Date.now() - 35 * 24 * 60 * 60 * 1000,
      articles: [
        { name: "Zapato Deportivo", color: "Rojo", value: 1000, pairs: 5 },
      ],
      paymentCondition: "15 días",
      expectedDiscount: 0,
      toPay: 5000,
      payed: 5000,
      rest: 0,
      stateBilling: "Cobrado",
      clientId: "client-001",
      brand: "Fábrica Estándar",
      branch: "Casual",
      comments: [{ comments: "Pagado en su totalidad el 2025-07-15", date: Date.now() - 35 * 24 * 60 * 60 * 1000 }],
      clientName: "Zapatería XYZ S.A.",
      timeStamp: Date.now(),
    } as BillingModel,

    // Factura con descuento (movimiento virtual)
    withDiscount: {
      billingNumber: "FAC-004",
      orderId: "order-001",
      type: "Factura",
      total: 8000,
      loadDate: Date.now() - 10 * 24 * 60 * 60 * 1000,
      deliveryDate: Date.now() - 10 * 24 * 60 * 60 * 1000,
      payDate: Date.now() + 5 * 24 * 60 * 60 * 1000, // Vence en 5 días
      articles: [
        { name: "Zapato Premium", color: "Azul", value: 1000, pairs: 8 },
      ],
      paymentCondition: "15 días",
      expectedDiscount: 5, // 5% descuento por pronto pago
      toPay: 7600, // 8000 - 5%
      payed: 7600, // Descuento aplicado
      rest: 0,
      stateBilling: "Cobrado",
      clientId: "client-001",
      brand: "Fábrica Estándar",
      branch: "Casual",
      comments: [{ comments: "Pronto pago aplicado (5%)", date: Date.now() - 8 * 24 * 60 * 60 * 1000 }],
      clientName: "Zapatería XYZ S.A.",
      timeStamp: Date.now(),
    } as BillingModel,

    // Factura sin condición de pago
    noPaymentCondition: {
      billingNumber: "FAC-005",
      orderId: "order-001",
      type: "Factura",
      total: 2000,
      loadDate: Date.now() - 1 * 24 * 60 * 60 * 1000,
      deliveryDate: Date.now() - 1 * 24 * 60 * 60 * 1000,
      payDate: 0, // Sin fecha de pago definida
      articles: [
        { name: "Zapato Simple", color: "Gris", value: 1000, pairs: 2 },
      ],
      paymentCondition: "",
      expectedDiscount: 0,
      toPay: 2000,
      payed: 0,
      rest: 2000,
      stateBilling: "Pendiente",
      clientId: "client-001",
      brand: "Fábrica Estándar",
      branch: "Casual",
      comments: [],
      clientName: "Zapatería XYZ S.A.",
      timeStamp: Date.now(),
    } as BillingModel,
  },
};

/**
 * Utilidad: obtener fecha futura en milisegundos
 */
export function getFutureDate(days: number): number {
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

/**
 * Utilidad: obtener fecha pasada en milisegundos
 */
export function getPastDate(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

/**
 * Utilidad: crear una factura personalizada para tests
 */
export function createInvoice(overrides: Partial<BillingModel>): BillingModel {
  return {
    ...FIXTURES.invoices.pending,
    ...overrides,
  };
}

/**
 * Utilidad: crear una fábrica personalizada para tests
 */
export function createFactory(overrides: Partial<FactoryModel>): FactoryModel {
  return {
    ...FIXTURES.factories.standard,
    ...overrides,
  };
}

/**
 * Utilidad: crear una condición de pago personalizada para tests
 */
export function createPaymentCondition(expiration: number, paymentName = "Condición"): PaymentCondition {
  return {
    paymentName,
    discount: 0,
    month: 0,
    expiration,
    date: 0,
    quantity: 1,
  };
}
