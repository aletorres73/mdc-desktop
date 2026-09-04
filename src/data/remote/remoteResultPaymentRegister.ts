export interface RemotePaymentRegisterResult {
  "Pago Id": number;
  "Cliente ID": string;
  "Marca": string;
  "Fecha": number;
  "Razón Social": string;
  "Remito": string;
  "Tipo": string;
  "Monto pagado": number;
  "Notas": string;
  "Metodo": string;
  "Estado": string;
  "Fecha Conciliacion": number;
  "Fecha Confirmacion": number;
  "Es Virtual": boolean;
}