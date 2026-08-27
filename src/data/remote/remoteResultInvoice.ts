export interface RemoteResultBillingModel {
  Numero: string;
  Orden: string;
  "Tipo Facturacion": string;
  Total: string;
  Fecha: number;
  "Fecha recepción": number;
  "Fecha Pago": number;
  Articulos: RemoteArticle[];
  "Condicion de pago": string;
  Dto: number;
  "A cobrar": number;
  Pagado: string;
  Saldo: string;
  Estado: string;
  "Cliente Id": string;
  Marca: string;
  Segmento: string;
  Comentarios: RemoteBillingComments[];
  "Razon Social": string;
  Timestamp: number;
}

export interface RemoteArticle {
  Articulo: string;
  Color: string;
  Importe: string;
  Pares: string;
}

export interface RemoteBillingComments {
  comments: string;
  date: number;
}

export interface InvoicePage {
  items: RemoteResultBillingModel[];
  nextCursor: string | null;
  quantity: number;
  endReached: boolean;
}
