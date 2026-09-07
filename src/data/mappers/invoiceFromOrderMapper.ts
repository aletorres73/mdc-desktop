import type { BuyOrderModel } from "@/domain/entities/buyOrder";
import type { BillingModel, ArticleModel } from "@/domain/entities/billing";

export function buyOrderToBilling(order: BuyOrderModel, billingNumber: string): BillingModel {
  const articles: ArticleModel[] = order.articles.map((a) => ({
    name: a.name,
    color: a.color,
    value: a.value ?? 0,
    pairs: a.pairs,
  }));
  const total = articles.reduce((sum, a) => sum + a.value * a.pairs, 0);
  const toPay = total * (1 - (order.discount || 0) / 100);

  return {
    billingNumber,
    orderId: order.id,
    type: "Factura",
    total,
    loadDate: Date.now(),
    deliveryDate: order.deliveryDate,
    payDate: 0,
    articles,
    paymentCondition: order.paymentCondition,
    expectedDiscount: order.discount,
    toPay,
    payed: 0,
    rest: toPay,
    stateBilling: "Pendiente",
    clientId: order.clientId,
    brand: order.factory,
    branch: order.branch,
    comments: [],
    clientName: order.client,
    timeStamp: Date.now(),
  };
}

export function validateBuyOrderForBilling(order: BuyOrderModel): string | null {
  if (!order.articles.length) return "El pedido no tiene artículos";
  if (!order.clientId) return "El pedido no tiene cliente asociado";
  return null;
}
