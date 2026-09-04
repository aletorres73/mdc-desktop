import {
  getDocument,
  setDocument,
  addDocument,
  deleteDocument,
  where,
  orderBy,
  limit,
  startAfter,
} from "@/data/datasources/firestore";
import { collection, getDocs, query as fsQuery, doc, getDoc } from "firebase/firestore";
import { db } from "@/data/datasources/config";
import { toBillingDomain, toBillingRemote } from "@/data/mappers/billingMapper";
import type { RemoteResultBillingModel } from "@/data/remote/remoteBilling";
import type { IInvoiceRepository, InvoiceFilters } from "@/domain/repositories/IInvoiceRepository";
import type { BillingModel, InvoicePage } from "@/domain/entities/billing";

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
    const constraints = [];
    if (filters.clientId) constraints.push(where("Cliente Id", "==", filters.clientId));
    if (filters.brand) constraints.push(where("Marca", "==", filters.brand));
    if (filters.state) constraints.push(where("Estado", "==", filters.state));
    constraints.push(orderBy("Timestamp", "desc"));

    if (cursor) {
      const cursorSnap = await getDoc(doc(db, this.path(uid), cursor));
      if (cursorSnap.exists()) constraints.push(startAfter(cursorSnap));
    }
    constraints.push(limit(pageSize));

    const q = fsQuery(collection(db, this.path(uid)), ...constraints);
    const snap = await getDocs(q);
    const items: BillingModel[] = snap.docs.map((d) =>
      toBillingDomain(d.id, d.data() as RemoteResultBillingModel),
    );

    return {
      items,
      nextCursor: snap.docs.length ? snap.docs[snap.docs.length - 1].id : null,
      quantity: items.length,
      endReached: snap.docs.length < pageSize,
    };
  }

  async getInvoice(uid: string, id: string): Promise<BillingModel | null> {
    const remote = await getDocument<RemoteResultBillingModel>(this.path(uid), id);
    return remote ? toBillingDomain(id, remote) : null;
  }

  async createInvoice(uid: string, billing: BillingModel): Promise<string> {
    if (billing.id) {
      await setDocument(this.path(uid), billing.id, toBillingRemote(billing));
      return billing.id;
    }
    return addDocument(this.path(uid), toBillingRemote(billing));
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
