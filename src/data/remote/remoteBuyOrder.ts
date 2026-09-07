export interface RemoteArticleOrderModel {
  Articulo: string;
  Color: string;
  Entregados: string;
  Pares: string;
  Valor?: string;
}

export interface RemoteResultBuyOrder {
  "Pedido Id": string;
  "Orden Id": string;
  "Cliente Id": string;
  "Razón Social": string;
  Fábrica: string;
  Marca: string;
  "Plazo de entrega": number;
  Tipo: string;
  Facturación: string;
  Comentarios: string;
  Articulos: RemoteArticleOrderModel[];
  "Fecha de carga": number;
  "Condición de Pago": string;
  Descuento: number;
  "Días Vencimiento": number;
  Timestamp: number;
}

export interface RemoteBranchOrder {
  Marca: string;
}
