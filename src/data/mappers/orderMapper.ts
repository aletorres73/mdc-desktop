import type { RemoteResultOrder } from "@/data/remote/remoteOrder";
import type { OrderModel } from "@/domain/entities/order";

export function toOrderDomain(remote: RemoteResultOrder): OrderModel {
  return {
    orderNumber: remote["N° "] || "",
    nameClient: remote["Razón Social"] || "",
    branch: remote["Marca"] || "",
    type: remote["Tipo"] || "",
    documentDate: remote["Fecha Remito/Factura"] || 0,
    numberDocument: remote["N° Factura/Remito"] || "",
    trackingState: remote["Estado de despacho"] || "",
    documentComments: remote["Comentarios"] || "",
    sellOut: remote["Descuentos"] || "",
    inputDate: remote["Fecha de carga"] || 0,
    payState: remote["Estado de cobranza"] || "",
    receptionDate: remote["Fecha recepción"] || 0,
    payDate: remote["Fecha de pago"] || 0,
    valueDocument: remote["Importe fc/rt"] || "",
    discount: remote["Desc / Dev"] || "",
    payAmount: remote["Monto a cobrar"] || "",
    payedAmount: remote["Monto cobrado"] || "",
    payDifference: remote["Diferencia"] || "",
    orders: remote["Pedidos"] || "",
    documents: remote["Remitos/ Facturas"] ?? null,
    checked: remote["Comprobantes"] ?? null,
    calendar: remote["Calendario"] ?? null,
    date: remote["Plazo"] || 0,
  };
}

export function toOrderRemote(domain: OrderModel): RemoteResultOrder {
  return {
    "N° ": domain.orderNumber,
    "Razón Social": domain.nameClient,
    Marca: domain.branch,
    Tipo: domain.type,
    "Fecha Remito/Factura": domain.documentDate,
    "N° Factura/Remito": domain.numberDocument,
    "Estado de despacho": domain.trackingState,
    Comentarios: domain.documentComments,
    Descuentos: domain.sellOut,
    "Fecha de carga": domain.inputDate,
    "Estado de cobranza": domain.payState,
    "Fecha recepción": domain.receptionDate,
    "Fecha de pago": domain.payDate,
    "Importe fc/rt": domain.valueDocument,
    "Desc / Dev": domain.discount,
    "Monto a cobrar": domain.payAmount,
    "Monto cobrado": domain.payedAmount,
    Diferencia: domain.payDifference,
    Pedidos: domain.orders,
    "Remitos/ Facturas": domain.documents,
    Comprobantes: domain.checked,
    Calendario: domain.calendar,
    Plazo: domain.date,
  };
}
