import {
  getDocument,
  setDocument,
  deleteDocument,
  where,
  orderBy,
  limit,
  startAfter,
} from "@/data/datasources/firestore";
import { collection, getDocs, query as fsQuery, doc, getDoc, type QueryConstraint } from "firebase/firestore";
import { db } from "@/data/datasources/config";
import { toBillingDomain, toBillingRemote } from "@/data/mappers/billingMapper";
import type { RemoteResultBillingModel } from "@/data/remote/remoteBilling";
import type { IInvoiceRepository, InvoiceFilters } from "@/domain/repositories/IInvoiceRepository";
import type { BillingModel, InvoicePage } from "@/domain/entities/billing";
import { matchesInvoiceSearch, normalizeInvoiceSearch } from "@/domain/logic/invoiceList";

export class FirestoreInvoiceRepository implements IInvoiceRepository {
  private path(uid: string) {
    return `users/${uid}/allBillings`;
  }

  async getInvoicesPage(
    uid: string,
    filters: InvoiceFilters,
    pageSize: number,
    cursor?: string | null,
  ): Promise<InvoicePage> {
    const normalizedSearch = normalizeInvoiceSearch(filters.searchText ?? filters.clientNamePrefix ?? "");
    const needsLocalSearch = normalizedSearch.length > 0;

    const baseConstraints: QueryConstraint[] = [];
    if (filters.clientId) baseConstraints.push(where("Cliente Id", "==", filters.clientId));
    if (filters.brand) baseConstraints.push(where("Marca", "==", filters.brand));
    if (filters.state) baseConstraints.push(where("Estado", "==", filters.state));
    baseConstraints.push(orderBy("Timestamp", "desc"));

    const items: BillingModel[] = [];
    const seenIds = new Set<string>();

    let pageCursor = cursor ?? null;
    let endReached = false;

    while (items.length < pageSize && !endReached) {
      const constraints: QueryConstraint[] = [...baseConstraints];

      if (pageCursor) {
        const cursorSnap = await getDoc(doc(db, this.path(uid), pageCursor));
        if (cursorSnap.exists()) constraints.push(startAfter(cursorSnap));
      }

      constraints.push(limit(pageSize));

      const q = fsQuery(collection(db, this.path(uid)), ...constraints);
      const snap = await getDocs(q);
      if (snap.empty) {
        endReached = true;
        break;
      }

      for (const invoiceDoc of snap.docs) {
        const invoice = toBillingDomain(invoiceDoc.id, invoiceDoc.data() as RemoteResultBillingModel);
        if (needsLocalSearch && !matchesInvoiceSearch(invoice, normalizedSearch)) continue;
        if (seenIds.has(invoice.id!)) continue;
        seenIds.add(invoice.id!);
        items.push(invoice);
        if (items.length >= pageSize) break;
      }

      pageCursor = snap.docs[snap.docs.length - 1]?.id ?? null;
      if (snap.docs.length < pageSize) endReached = true;
      if (!needsLocalSearch) break;
    }

    return {
      items,
      nextCursor: endReached ? null : pageCursor,
      quantity: items.length,
      endReached,
    };
  }

  async getInvoice(uid: string, id: string): Promise<BillingModel | null> {
    const remote = await getDocument<RemoteResultBillingModel>(this.path(uid), id);
    return remote ? toBillingDomain(id, remote) : null;
  }

  async getInvoiceByBillingNumber(uid: string, billingNumber: string): Promise<BillingModel | null> {
    const normalized = billingNumber.trim();
    if (!normalized) return null;

    const q = fsQuery(
      collection(db, this.path(uid)),
      where("Numero", "==", normalized),
      limit(1),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const doc = snap.docs[0];
    return toBillingDomain(doc.id, doc.data() as RemoteResultBillingModel);
  }

  async createInvoice(uid: string, billing: BillingModel): Promise<string> {
    const documentId = billing.id ?? billing.billingNumber.trim();
    if (!documentId) throw new Error("El número de factura es obligatorio");

    const duplicate = billing.billingNumber ? await this.getInvoiceByBillingNumber(uid, billing.billingNumber) : null;
    if (duplicate?.id) {
      await this.updateInvoice(uid, duplicate.id, billing);
      return duplicate.id;
    }

    await setDocument(this.path(uid), documentId, toBillingRemote(billing));
    return documentId;
  }

  async updateInvoice(uid: string, id: string, data: Partial<BillingModel>): Promise<void> {
    const current = await this.getInvoice(uid, id);
    if (!current) throw new Error("Invoice not found");
    await setDocument(this.path(uid), id, toBillingRemote({ ...current, ...data }));
  }

  async deleteInvoice(uid: string, id: string): Promise<void> {
    await deleteDocument(this.path(uid), id);
  }
}
