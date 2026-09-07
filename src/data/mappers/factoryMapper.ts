import type { RemoteResultFactoryModel } from "@/data/remote/remoteFactory";
import type { FactoryModel, PaymentCondition } from "@/domain/entities/factory";

export function toFactoryDomain(remote: RemoteResultFactoryModel): FactoryModel {
  const conditions = remote["Condiciones"] || {};
  const paymentType: PaymentCondition[] = Object.values(conditions).map((c) => ({
    paymentName: c["condicion"] || "",
    discount: parseFloat(c["dto"]) || 0,
    month: parseFloat(c["meses"]) || 0,
    expiration: parseFloat(c["vencimiento"]) || 0,
    date: parseFloat(c["plazo"]) || 0,
    quantity: parseFloat(c["pagos"]) || 0,
  }));

  return {
    name: remote["Fabrica"] || "",
    branchList: remote["Marcas"] || [],
    paymentType,
    defaultCommission: remote["ComisionBase"] || 0,
    segmentCommissions: remote["ComisionesSegmento"] || {},
  };
}

export function toFactoryRemote(domain: FactoryModel): RemoteResultFactoryModel {
  const conditions: Record<string, Record<string, string>> = {};
  domain.paymentType.forEach((c, idx) => {
    conditions[`condicion${idx + 1}`] = {
      condicion: c.paymentName,
      dto: String(c.discount),
      meses: String(c.month),
      vencimiento: String(c.expiration),
      plazo: String(c.date),
      pagos: String(c.quantity),
    };
  });

  return {
    Fabrica: domain.name,
    Marcas: domain.branchList,
    Condiciones: conditions,
    ComisionBase: domain.defaultCommission,
    ComisionesSegmento: domain.segmentCommissions,
  };
}

export function toFactoryRemotePartial(data: Partial<FactoryModel>): Partial<RemoteResultFactoryModel> {
  const remote: Partial<RemoteResultFactoryModel> = {};

  if (data.name !== undefined) remote.Fabrica = data.name;
  if (data.branchList !== undefined) remote.Marcas = data.branchList;
  if (data.paymentType !== undefined) {
    const conditions: Record<string, Record<string, string>> = {};
    data.paymentType.forEach((condition, idx) => {
      conditions[`condicion${idx + 1}`] = {
        condicion: condition.paymentName,
        dto: String(condition.discount),
        meses: String(condition.month),
        vencimiento: String(condition.expiration),
        plazo: String(condition.date),
        pagos: String(condition.quantity),
      };
    });
    remote.Condiciones = conditions;
  }
  if (data.defaultCommission !== undefined) remote.ComisionBase = data.defaultCommission;
  if (data.segmentCommissions !== undefined) remote.ComisionesSegmento = data.segmentCommissions;

  return remote;
}
