import type { FactoryModel, PaymentCondition } from "@/domain/entities/factory";
import type { RemoteResultFactoryModel } from "../remote/remoteResultFactory";

export function toPaymentConditions(
  conditions: RemoteResultFactoryModel["Condiciones"] | null | undefined
): PaymentCondition[] {
  return Object.values(conditions ?? {}).map((cond) => ({
    paymentName: cond.condicion ?? "Sin condición",
    discount: parseFloat(cond.dto ?? "0"),
    month: parseInt(cond.meses ?? "0"),
    expiration: parseInt(cond.vencimiento ?? "0"),
    date: parseInt(cond.plazo ?? "0"),
    quantity: parseInt(cond.pagos ?? "0"),
  }));
}

export function toFactoryDomain(remote: RemoteResultFactoryModel): FactoryModel {
  const paymentType = toPaymentConditions(remote.Condiciones);

  return {
    name: remote.Fabrica,
    branchList: remote.Marcas ?? [],
    paymentType,
    defaultCommission: remote.ComisionBase ?? 0,
    segmentCommissions: remote.ComisionesSegmento ?? {},
  };
}

export function toFactoryRemote(factory: FactoryModel): RemoteResultFactoryModel {
  const condiciones: Record<string, Record<string, string>> = {};
  factory.paymentType.forEach((pc, index) => {
    condiciones[`condicion${index + 1}`] = {
      condicion: pc.paymentName,
      dto: pc.discount.toString(),
      meses: pc.month.toString(),
      vencimiento: pc.expiration.toString(),
      plazo: pc.date.toString(),
      pagos: pc.quantity.toString(),
    };
  });

  return {
    Fabrica: factory.name,
    Marcas: factory.branchList,
    Condiciones: condiciones,
    ComisionBase: factory.defaultCommission,
    ComisionesSegmento: factory.segmentCommissions,
  };
}
