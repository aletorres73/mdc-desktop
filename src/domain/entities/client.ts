export interface ClientModel {
  clientId: string;
  clientName: string;
  fantasyName?: string;
  cuit?: string;
  address?: string;
  taxAddress?: string;
  city?: string;
  taxCity?: string;
  deliveryTime?: string;
  email?: string;
  phone?: string;
  contactName?: string;
}

export interface ClientFilters {
  search: string;
}
