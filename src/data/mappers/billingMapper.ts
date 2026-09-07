import type { RemoteResultBillingModel, RemoteArticle, RemoteBillingComments } from "@/data/remote/remoteBilling";
import type { BillingModel, ArticleModel, BillingComments } from "@/domain/entities/billing";
import { parseMoneyToNumber, formatNumberToMoney } from "@/data/mappers/money";

export function toBillingDomain(id: string, remote: RemoteResultBillingModel): BillingModel {
  return {
    id,
    billingNumber: remote["Numero"] || "",
    orderId: remote["Orden"] || "",
    type: remote["Tipo Facturacion"] || "",
    total: parseMoneyToNumber(remote["Total"]),
    loadDate: remote["Fecha"] || 0,
    deliveryDate: remote["Fecha recepción"] || 0,
    payDate: remote["Fecha Pago"] || 0,
    articles: (remote["Articulos"] || []).map((art: RemoteArticle) => ({
      name: art["Articulo"] || "",
      color: art["Color"] || "",
      value: parseMoneyToNumber(art["Importe"]),
      pairs: parseInt(art["Pares"], 10) || 0,
    })),
    paymentCondition: remote["Condicion de pago"] || "",
    expectedDiscount: remote["Dto"] || 0,
    toPay: parseMoneyToNumber(remote["A cobrar"]),
    payed: parseMoneyToNumber(remote["Pagado"]),
    rest: parseMoneyToNumber(remote["Saldo"]),
    stateBilling: remote["Estado"] || "",
    clientId: remote["Cliente Id"] || "",
    brand: remote["Marca"] || "",
    branch: remote["Segmento"] || "",
    comments: (remote["Comentarios"] || []).map((c: RemoteBillingComments) => ({
      comments: c.comments || "",
      date: c.date || 0,
    })),
    clientName: remote["Razon Social"] || "",
    timeStamp: remote["Timestamp"] || 0,
  };
}

export function toBillingRemote(domain: BillingModel): RemoteResultBillingModel {
  return {
    Numero: domain.billingNumber,
    Orden: domain.orderId,
    "Tipo Facturacion": domain.type,
    Total: formatNumberToMoney(domain.total),
    Fecha: domain.loadDate,
    "Fecha recepción": domain.deliveryDate,
    "Fecha Pago": domain.payDate,
    Articulos: domain.articles.map((a: ArticleModel) => ({
      Articulo: a.name,
      Color: a.color,
      Importe: formatNumberToMoney(a.value),
      Pares: String(a.pairs),
    })),
    "Condicion de pago": domain.paymentCondition,
    Dto: domain.expectedDiscount,
    "A cobrar": formatNumberToMoney(domain.toPay),
    Pagado: formatNumberToMoney(domain.payed),
    Saldo: formatNumberToMoney(domain.rest),
    Estado: domain.stateBilling,
    "Cliente Id": domain.clientId,
    Marca: domain.brand,
    Segmento: domain.branch,
    Comentarios: domain.comments.map((c: BillingComments) => ({ comments: c.comments, date: c.date })),
    "Razon Social": domain.clientName,
    Timestamp: domain.timeStamp,
  };
}
