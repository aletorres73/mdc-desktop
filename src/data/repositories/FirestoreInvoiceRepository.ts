import type { IInvoiceRepository, FetchInvoiceOptions } from "@/domain/repositories/IInvoiceRepository";
import type { BillingModel, InvoicePageDomain } from "@/domain/entities/invoice";
import { getCollection, updateDocument } from "../datasources";
import type { RemoteResultBillingModel } from "../remote/remoteResultInvoice";
import { toBillingDomain } from "../mappers/invoiceMapper";

function billingsPath(uid: string): string {
  return `users/${uid}/allBillings`;
}

export class FirestoreInvoiceRepository implements IInvoiceRepository {
  async fetchPage(uid: string, options: FetchInvoiceOptions): Promise<InvoicePageDomain> {
    const pageSize = options.pageSize ?? 20;
    const limitCount = pageSize + 1; // fetch 1 extra to check endReached

    const formattedFilters = options.filters?.map((f) => ({
      field: f.field,
      op: f.op as "=" | "==" | "<" | "<=" | ">" | ">=" | "array-contains" | "in",
      value: f.value,
    }));

    const docs = await getCollection<RemoteResultBillingModel>(billingsPath(uid), {
      filters: formattedFilters,
      orderBy: options.orderByField
        ? { field: options.orderByField, direction: options.direction ?? "asc" }
        : undefined,
      limit: limitCount,
      startAfter: options.startAfter,
    });

    const endReached = docs.length <= pageSize;
    const pageDocs = endReached ? docs : docs.slice(0, pageSize);
    const domainItems = pageDocs.map(toBillingDomain);

    let nextCursor: string | null = null;
    if (!endReached && pageDocs.length > 0) {
      const lastDoc = pageDocs[pageDocs.length - 1];
      const orderByField = options.orderByField || "Timestamp";
      const rawVal = (lastDoc as unknown as Record<string, unknown>)[orderByField];
      nextCursor = rawVal !== undefined && rawVal !== null ? String(rawVal) : null;
    }

    return {
      items: domainItems,
      nextCursor,
      quantity: domainItems.length,
      endReached,
    };
  }

  async getInvoiceByNumber(uid: string, invoiceNumber: string): Promise<BillingModel | null> {
    const docs = await getCollection<RemoteResultBillingModel>(billingsPath(uid), {
      filters: [{ field: "Numero", op: "=", value: invoiceNumber }],
      limit: 1,
    });
    if (docs.length > 0) {
      return toBillingDomain(docs[0]);
    }
    return null;
  }

  async getAllBillings(uid: string): Promise<BillingModel[]> {
    const docs = await getCollection<RemoteResultBillingModel>(billingsPath(uid));
    return docs.map(toBillingDomain);
  }

  async updateInvoice(uid: string, billingNumber: string, data: Partial<BillingModel>): Promise<void> {
    // If updating via domain fields, convert if necessary or pass directly if keys match
    await updateDocument(billingsPath(uid), billingNumber, data as Record<string, unknown>);
  }
}
