export interface RemoteResultOrder {
  "N° ": string;
  "Razón Social": string;
  Marca: string;
  Tipo: string;
  "Fecha Remito/Factura": number;
  "N° Factura/Remito": string;
  "Estado de despacho": string;
  Comentarios: string;
  Descuentos: string;
  "Fecha de carga": number;
  "Estado de cobranza": string;
  "Fecha recepción": number;
  "Fecha de pago": number;
  "Importe fc/rt": string;
  "Desc / Dev": string;
  "Monto a cobrar": string;
  "Monto cobrado": string;
  Diferencia: string;
  Pedidos: string;
  "Remitos/ Facturas"?: string | null;
  Comprobantes?: string | null;
  Calendario?: string | null;
  Plazo: number;
}
