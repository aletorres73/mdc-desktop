export interface RemoteResultBuyOrder {
  "Pedido Id": string;
  "Orden Id": string;
  "Cliente Id": string;
  "Razón Social": string;
  "Fábrica": string;
  "Marca": string;
  "Plazo de entrega": number;
  "Tipo": string;
  "Facturación": string;
  "Comentarios": string;
  "Articulos": RemoteArticleOrderModel[];
  "Fecha de carga": number;
  "Condición de Pago": string;
  "Descuento": number;
  "Días Vencimiento": number;
  "Timestamp": number;
}

export interface RemoteArticleOrderModel {
  "Articulo": string;
  "Color": string;
  "Entregados": string;
  "Pares": string;
  "Importe"?: string; // Precio unitario
}

export interface RemoteResultOrder {
  "N° ": string;
  "Razón Social": string;
  "Marca": string;
  "Tipo": string;
  "Fecha Remito/Factura": number;
  "N° Factura/Remito": string;
  "Estado de despacho": string;
  "Comentarios": string;
  "Descuentos": string;
  "Fecha de carga": number;
  "Estado de cobranza": string;
  "Fecha recepción": number;
  "Fecha de pago": number;
  "Importe fc/rt": string;
  "Desc / Dev": string;
  "Monto a cobrar": string;
  "Monto cobrado": string;
  "Diferencia": string;
  "Pedidos": string;
  "Remitos/ Facturas"?: string | null;
  "Comprobantes"?: string | null;
  "Calendario"?: string | null;
  "Plazo": number;
}
