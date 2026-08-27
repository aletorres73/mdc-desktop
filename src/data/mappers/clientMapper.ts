import type { ClientModel } from "@/domain/entities/client";
import type { RemoteResultClientModel } from "../remote/remoteResultClient";

export function toClientDomain(remote: RemoteResultClientModel): ClientModel {
  return {
    clientId: remote["Cliente Id"],
    clientName: remote["Razón Social"],
    fantasyName: remote["Nombre fantasia"],
    cuit: remote.CUIT,
    address: remote["Direccion Comercio"],
    taxAddress: remote["Direccion Fiscal"],
    city: remote["Localidad Comercio"],
    taxCity: remote["Localidad Fiscal"],
    deliveryTime: remote["Horario de entrega"],
    email: remote.Email,
    phone: remote.Telefono,
    contactName: remote.Contacto,
  };
}

export function toClientRemote(domain: ClientModel): RemoteResultClientModel {
  return {
    "Cliente Id": domain.clientId,
    "Razón Social": domain.clientName,
    "Nombre fantasia": domain.fantasyName,
    CUIT: domain.cuit,
    "Direccion Comercio": domain.address,
    "Direccion Fiscal": domain.taxAddress,
    "Localidad Comercio": domain.city,
    "Localidad Fiscal": domain.taxCity,
    "Horario de entrega": domain.deliveryTime,
    Email: domain.email,
    Telefono: domain.phone,
    Contacto: domain.contactName,
  };
}
