import type { BuyOrderModel, OrderModel } from "@/domain/entities/order";
import type { RemoteResultBuyOrder, RemoteResultOrder } from "../remote/remoteResultOrder";

export function toBuyOrderDomain(remote: RemoteResultBuyOrder): BuyOrderModel {
  return {
    id: remote["Pedido Id"],
    clientId: remote["Cliente Id"],
    order: remote["Orden Id"],
    client: remote["Razón Social"],
    factory: remote["Fábrica"],
    branch: remote["Marca"],
    deliveryDate: remote["Plazo de entrega"],
    type: remote["Tipo"],
    billing: remote["Facturación"],
    comments: remote["Comentarios"],
    articles: (remote["Articulos"] ?? []).map((a) => ({
      name: a["Articulo"],
      color: a["Color"],
      delivered: parseInt(a["Entregados"]) || 0,
      pairs: parseInt(a["Pares"]) || 0,
      value: parseFloat(a["Importe"] ?? "0") || 0,
    })),
    loadedDate: remote["Fecha de carga"],
    paymentCondition: remote["Condición de Pago"],
    discount: remote["Descuento"],
    expirationDays: remote["Días Vencimiento"],
    timeStamp: remote["Timestamp"],
  };
}

export function toBuyOrderRemote(domain: BuyOrderModel): RemoteResultBuyOrder {
  return {
    "Pedido Id": domain.id,
    "Cliente Id": domain.clientId,
    "Orden Id": domain.order,
    "Razón Social": domain.client,
    "Fábrica": domain.factory,
    "Marca": domain.branch,
    "Plazo de entrega": domain.deliveryDate,
    "Tipo": domain.type,
    "Facturación": domain.billing,
    "Comentarios": domain.comments,
    "Articulos": domain.articles.map((a) => ({
      "Articulo": a.name,
      "Color": a.color,
      "Entregados": a.delivered.toString(),
      "Pares": a.pairs.toString(),
      "Importe": (a.value || 0).toString(),
    })),
    "Fecha de carga": domain.loadedDate,
    "Condición de Pago": domain.paymentCondition,
    "Descuento": domain.discount,
    "Días Vencimiento": domain.expirationDays,
    "Timestamp": domain.timeStamp,
  };
}

export function toOrderDomain(remote: RemoteResultOrder): OrderModel {
  return {
    orderNumber: remote["N° "],
    nameClient: remote["Razón Social"],
    branch: remote["Marca"],
    type: remote["Tipo"],
    documentDate: remote["Fecha Remito/Factura"],
    numberDocument: remote["N° Factura/Remito"],
    trackingState: remote["Estado de despacho"],
    documentComments: remote["Comentarios"],
    sellOut: remote["Descuentos"],
    inputDate: remote["Fecha de carga"],
    payState: remote["Estado de cobranza"],
    receptionDate: remote["Fecha recepción"],
    payDate: remote["Fecha de pago"],
    valueDocument: remote["Importe fc/rt"],
    discount: remote["Desc / Dev"],
    payAmount: remote["Monto a cobrar"],
    payedAmount: remote["Monto cobrado"],
    payDifference: remote["Diferencia"],
    orders: remote["Pedidos"],
    documents: remote["Remitos/ Facturas"] ?? null,
    checked: remote["Comprobantes"] ?? null,
    calendar: remote["Calendario"] ?? null,
    date: remote["Plazo"],
  };
}
