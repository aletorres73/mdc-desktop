import type { BillingModel } from "@/domain/entities/invoice";
import type { RemoteResultBillingModel } from "../remote/remoteResultInvoice";

export function toBillingDomain(remote: RemoteResultBillingModel): BillingModel {
  return {
    billingNumber: remote.Numero,
    orderId: remote.Orden,
    type: remote["Tipo Facturacion"],
    total: parseFloat(remote.Total) || 0,
    loadDate: remote.Fecha,
    deliveryDate: remote["Fecha recepción"],
    payDate: remote["Fecha Pago"],
    articles: (remote.Articulos ?? []).map((a) => ({
      name: a.Articulo,
      color: a.Color,
      value: parseFloat(a.Importe) || 0,
      pairs: parseInt(a.Pares) || 0,
    })),
    paymentCondition: remote["Condicion de pago"],
    expectedDiscount: remote.Dto,
    toPay: remote["A cobrar"],
    payed: parseFloat(remote.Pagado) || 0,
    rest: parseFloat(remote.Saldo) || 0,
    stateBilling: remote.Estado,
    clientId: remote["Cliente Id"],
    brand: remote.Marca,
    branch: remote.Segmento,
    comments: (remote.Comentarios ?? []).map((c) => ({
      comments: c.comments,
      date: c.date,
    })),
    clientName: remote["Razon Social"],
    timeStamp: remote.Timestamp,
    payments: (remote.Pagos ?? []).map((payment) => ({
      id: payment.id,
      amount: Number(payment.amount) || 0,
      type: payment.type,
      status: payment.status,
      note: payment.note,
      virtualType: payment.virtualType,
      date: payment.date,
    })),
  };
}

export function toBillingRemote(domain: BillingModel): RemoteResultBillingModel {
  return {
    Numero: domain.billingNumber,
    Orden: domain.orderId,
    "Tipo Facturacion": domain.type,
    Total: domain.total.toString(),
    Fecha: domain.loadDate,
    "Fecha recepción": domain.deliveryDate,
    "Fecha Pago": domain.payDate,
    Articulos: domain.articles.map((a) => ({
      Articulo: a.name,
      Color: a.color,
      Importe: a.value.toString(),
      Pares: a.pairs.toString(),
    })),
    "Condicion de pago": domain.paymentCondition,
    Dto: domain.expectedDiscount,
    "A cobrar": domain.toPay,
    Pagado: domain.payed.toString(),
    Saldo: domain.rest.toString(),
    Estado: domain.stateBilling,
    "Cliente Id": domain.clientId,
    Marca: domain.brand,
    Segmento: domain.branch,
    Comentarios: domain.comments.map((c) => ({
      comments: c.comments,
      date: c.date,
    })),
    "Razon Social": domain.clientName,
    Timestamp: domain.timeStamp,
    Pagos: (domain.payments ?? []).map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      type: payment.type,
      status: payment.status,
      note: payment.note,
      virtualType: payment.virtualType,
      date: payment.date,
    })),
  };
}
