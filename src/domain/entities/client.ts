export interface ClientModel {
  clientId: string;
  clientName: string;
}

export interface InfoClientModel extends ClientModel {
  fantasyName: string;
  cuit: string;
  commercialAddress: string;
  fiscalAddress: string;
  commercialLocation: string;
  fiscalLocation: string;
  deliverySchedule: string;
  email: string;
  phone: string;
  contact: string;
}
