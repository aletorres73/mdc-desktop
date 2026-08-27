import type { IFactoryRepository } from "@/domain/repositories/IFactoryRepository";
import type { FactoryModel, PaymentCondition } from "@/domain/entities/factory";
import { getCollection, getDocument, setDocument, updateDocument, deleteDocument } from "../datasources";
import type { RemoteResultFactoryModel } from "../remote/remoteResultFactory";
import { toFactoryDomain, toFactoryRemote } from "../mappers/factoryMapper";

function factoriesPath(uid: string): string {
  return `users/${uid}/factories`;
}

export class FirestoreFactoryRepository implements IFactoryRepository {
  async getAllFactories(uid: string): Promise<FactoryModel[]> {
    const docs = await getCollection<RemoteResultFactoryModel>(factoriesPath(uid));
    return docs
      .map(toFactoryDomain)
      .sort((a, b) => b.branchList.length - a.branchList.length);
  }

  async getFactoryByName(uid: string, factoryName: string): Promise<FactoryModel | null> {
    const directDoc = await getDocument<RemoteResultFactoryModel>(factoriesPath(uid), factoryName);
    if (directDoc) {
      return toFactoryDomain(directDoc);
    }
    const queryDocs = await getCollection<RemoteResultFactoryModel>(factoriesPath(uid), {
      filters: [{ field: "Fabrica", op: "=", value: factoryName }],
      limit: 1,
    });
    if (queryDocs.length > 0) {
      return toFactoryDomain(queryDocs[0]);
    }
    return null;
  }

  async createFactory(uid: string, factory: FactoryModel): Promise<FactoryModel> {
    const remoteData = toFactoryRemote(factory);
    await setDocument(factoriesPath(uid), factory.name, remoteData as unknown as Record<string, unknown>);
    return factory;
  }

  async updateFactory(uid: string, factory: FactoryModel): Promise<FactoryModel> {
    const remoteData = toFactoryRemote(factory);
    await updateDocument(factoriesPath(uid), factory.name, remoteData as unknown as Record<string, unknown>);
    return factory;
  }

  async updatePaymentConditions(
    uid: string,
    factoryName: string,
    paymentConditions: PaymentCondition[]
  ): Promise<void> {
    const condiciones: Record<string, Record<string, string>> = {};
    paymentConditions.forEach((pc, index) => {
      condiciones[`condicion${index + 1}`] = {
        condicion: pc.paymentName,
        dto: pc.discount.toString(),
        meses: pc.month.toString(),
        vencimiento: pc.expiration.toString(),
        plazo: pc.date.toString(),
        pagos: pc.quantity.toString(),
      };
    });
    await updateDocument(factoriesPath(uid), factoryName, { Condiciones: condiciones });
  }

  async deleteFactory(uid: string, factoryName: string): Promise<string> {
    await deleteDocument(factoriesPath(uid), factoryName);
    return factoryName;
  }
}
