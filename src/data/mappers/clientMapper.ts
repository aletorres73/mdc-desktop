import type { RemoteResultClientModel, RemoteResultInfoClientModel } from "@/data/remote/remoteClient";
import type { ClientModel, InfoClientModel } from "@/domain/entities/client";

export function toClientDomain(remote: RemoteResultClientModel): ClientModel {
  return {
    clientId: remote["Cliente Id"] || "",
    clientName: remote["Razón Social"] || "",
    isActive: remote["Activo"] ?? true,
  };
}

export function toClientRemote(domain: ClientModel): RemoteResultClientModel {
  return {
    "Cliente Id": domain.clientId,
    "Razón Social": domain.clientName,
    "Activo": domain.isActive ?? true,
  };
}

export function toInfoClientDomain(remote: RemoteResultInfoClientModel): InfoClientModel {
  return {
    clientId: remote["Cliente Id"] || "",
    clientName: remote["Razón Social"] || "",
    fantasyName: remote["Nombre fantasia"] || "",
    cuit: remote["CUIT"] || "",
    commercialAddress: remote["Direccion Comercio"] || "",
    fiscalAddress: remote["Direccion Fiscal"] || "",
    commercialLocation: remote["Localidad Comercio"] || "",
    fiscalLocation: remote["Localidad Fiscal"] || "",
    deliverySchedule: remote["Horario de entrega"] || "",
    email: remote["Email"] || "",
    phone: remote["Telefono"] || "",
    contact: remote["Contacto"] || "",
  };
}

export function toInfoClientRemote(domain: InfoClientModel): RemoteResultInfoClientModel {
  return {
    "Cliente Id": domain.clientId,
    "Razón Social": domain.clientName,
    "Nombre fantasia": domain.fantasyName,
    CUIT: domain.cuit,
    "Direccion Comercio": domain.commercialAddress,
    "Direccion Fiscal": domain.fiscalAddress,
    "Localidad Comercio": domain.commercialLocation,
    "Localidad Fiscal": domain.fiscalLocation,
    "Horario de entrega": domain.deliverySchedule,
    Email: domain.email,
    Telefono: domain.phone,
    Contacto: domain.contact,
  };
}
