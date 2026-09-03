import type { BuyOrderModel, ArticleOrderModel } from "@/domain/entities/order";
import type { BillingModel, ArticleModel } from "@/domain/entities/invoice";

/**
 * Convierte un pedido de compra (BuyOrder) a una factura (Billing)
 * Esta función crea una nueva factura basada en los datos del pedido
 */
export function buyOrderToBilling(buyOrder: BuyOrderModel): BillingModel {
  // Mapear artículos del pedido a artículos de factura
  const articles: ArticleModel[] = buyOrder.articles.map((article: ArticleOrderModel) => ({
    name: article.name,
    color: article.color,
    value: article.value || 0,
    pairs: article.pairs,
  }));

  // Calcular total de la factura desde los artículos
  const total = articles.reduce((sum, a) => sum + a.value * a.pairs, 0);
  const toPay = total * (1 - (buyOrder.discount || 0) / 100);

  // Generar número de factura basado en el pedido
  const billingNumber = `FAC-${buyOrder.order}-${Date.now()}`;

  // Crear factura con estado inicial
  const now = Date.now();
  const billing: BillingModel = {
    billingNumber,
    orderId: buyOrder.order,
    type: "Factura",
    total,
    loadDate: now,
    deliveryDate: buyOrder.deliveryDate || now,
    payDate: 0, // Se calcula después según condición de pago
    articles,
    paymentCondition: buyOrder.paymentCondition || "Contado",
    expectedDiscount: buyOrder.discount || 0,
    toPay,
    payed: 0,
    rest: toPay,
    stateBilling: "Pendiente",
    clientId: buyOrder.clientId,
    brand: buyOrder.factory,
    branch: buyOrder.branch || "General",
    comments: buyOrder.comments ? [{ comments: buyOrder.comments, date: now }] : [],
    clientName: buyOrder.client,
    timeStamp: now,
  };

  return billing;
}

/**
 * Valida que un pedido tenga todos los datos necesarios para crear una factura
 */
export function validateBuyOrderForBilling(buyOrder: BuyOrderModel): string | null {
  if (!buyOrder.order) return "El pedido no tiene número";
  if (!buyOrder.clientId) return "El pedido no tiene cliente";
  if (!buyOrder.factory) return "El pedido no tiene fábrica";
  if (!buyOrder.articles || buyOrder.articles.length === 0) return "El pedido no tiene artículos";
  // Validar que al menos un artículo tiene valor
  const hasValidAmount = buyOrder.articles.some(a => (a.value || 0) > 0 && a.pairs > 0);
  if (!hasValidAmount) return "El pedido no tiene artículos con monto válido";

  return null; // Validación exitosa
}
