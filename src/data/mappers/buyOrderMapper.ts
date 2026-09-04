import type { RemoteResultBuyOrder, RemoteArticleOrderModel } from "@/data/remote/remoteBuyOrder";
import type { BuyOrderModel, ArticleOrderModel } from "@/domain/entities/buyOrder";

export function toBuyOrderDomain(remote: RemoteResultBuyOrder): BuyOrderModel {
  return {
    id: remote["Pedido Id"] || "",
    clientId: remote["Cliente Id"] || "",
    order: remote["Orden Id"] || "",
    client: remote["Razón Social"] || "",
    factory: remote["Fábrica"] || "",
    branch: remote["Marca"] || "",
    deliveryDate: remote["Plazo de entrega"] || 0,
    type: remote["Tipo"] || "",
    billing: remote["Facturación"] || "",
    comments: remote["Comentarios"] || "",
    articles: (remote["Articulos"] || []).map((art: RemoteArticleOrderModel) => ({
      name: art["Articulo"] || "",
      color: art["Color"] || "",
      delivered: parseInt(art["Entregados"], 10) || 0,
      pairs: parseInt(art["Pares"], 10) || 0,
    })),
    loadedDate: remote["Fecha de carga"] || 0,
    paymentCondition: remote["Condición de Pago"] || "",
    discount: remote["Descuento"] || 0,
    expirationDays: remote["Días Vencimiento"] || 0,
    timeStamp: remote["Timestamp"] || 0,
  };
}

export function toBuyOrderRemote(domain: BuyOrderModel): RemoteResultBuyOrder {
  return {
    "Pedido Id": domain.id,
    "Orden Id": domain.order,
    "Cliente Id": domain.clientId,
    "Razón Social": domain.client,
    Fábrica: domain.factory,
    Marca: domain.branch,
    "Plazo de entrega": domain.deliveryDate,
    Tipo: domain.type,
    Facturación: domain.billing,
    Comentarios: domain.comments,
    Articulos: domain.articles.map((a: ArticleOrderModel) => ({
      Articulo: a.name,
      Color: a.color,
      Entregados: String(a.delivered),
      Pares: String(a.pairs),
    })),
    "Fecha de carga": domain.loadedDate,
    "Condición de Pago": domain.paymentCondition,
    Descuento: domain.discount,
    "Días Vencimiento": domain.expirationDays,
    Timestamp: domain.timeStamp,
  };
}
