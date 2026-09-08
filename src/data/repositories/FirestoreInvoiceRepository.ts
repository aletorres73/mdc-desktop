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
// import { matchesInvoiceSearch, normalizeInvoiceSearch } from "@/domain/logic/invoiceList";

export class FirestoreInvoiceRepository implements IInvoiceRepository {
  private path(uid: string) {
    return `users/${uid}/allBillings`;
  }

  async getPendingInvoicesForAgenda(uid: string): Promise<BillingModel[]> {
    // 1. Delegamos el filtrado primario a Firebase usando los estados activos.
    // Esto excluye automáticamente el volumen histórico de facturas "Cobrado" o "Cerrada".
    const q = fsQuery(
      collection(db, this.path(uid)),
      where("Estado", "in", ["Pendiente", "Por vencer", "Vencido"])
    );
    
    const snap = await getDocs(q);
    
    // 2. Mapeamos los datos al dominio. 
    // toBillingDomain ya utiliza parseMoneyToNumber para convertir el string "Saldo" 
    // a un número real en la propiedad 'rest'.
    const activeInvoices = snap.docs.map((d) => 
      toBillingDomain(d.id, d.data() as RemoteResultBillingModel)
    );

    // 3. Filtramos localmente garantizando matemáticamente que haya deuda.
    // Como activeInvoices es una lista pequeña, este filtro es instantáneo.
    return activeInvoices.filter(invoice => invoice.rest > 0);
  }

  async getInvoicesPage(
    uid: string,
    filters: InvoiceFilters,
    pageSize: number,
    cursor?: string | null,
  ): Promise<InvoicePage> {
    const baseConstraints: QueryConstraint[] = [];

    // Filtros exactos
    if (filters.clientId) baseConstraints.push(where("Cliente Id", "==", filters.clientId));
    if (filters.brand) baseConstraints.push(where("Marca", "==", filters.brand));
    if (filters.state) baseConstraints.push(where("Estado", "==", filters.state));

    // Filtros de búsqueda delegados a Firestore
    if (filters.clientNamePrefix) {
      baseConstraints.push(where("Razon Social", ">=", filters.clientNamePrefix));
      baseConstraints.push(where("Razon Social", "<", filters.clientNamePrefix + "\uf8ff"));
    } else if (filters.searchText) {
      const searchTerm = filters.searchText.trim();
      const isNumeric = /^\d+$/.test(searchTerm);

      if (isNumeric) {
        // Si el usuario ingresa solo números, buscamos por número de factura
        baseConstraints.push(where("Numero", ">=", searchTerm));
        baseConstraints.push(where("Numero", "<", searchTerm + "\uf8ff"));
      } else {
        // Si ingresa texto, buscamos por Razón Social. 
        // Nota: Firestore distingue mayúsculas de minúsculas de forma nativa.
        // Lo ideal para el futuro es guardar un campo "razonSocial_lower" en Firestore.
        baseConstraints.push(where("Razon Social", ">=", searchTerm));
        baseConstraints.push(where("Razon Social", "<", searchTerm + "\uf8ff"));
      }
    }

    // where(Cliente Id) + orderBy(Timestamp) requiere índice compuesto inexistente;
    // para consultas por cliente ordenamos localmente.
    const sortLocally = Boolean(filters.clientId);
    if (!sortLocally) baseConstraints.push(orderBy("Timestamp", "desc"));

    // Paginación con cursor
    if (cursor) {
      const cursorSnap = await getDoc(doc(db, this.path(uid), cursor));
      if (cursorSnap.exists()) {
        baseConstraints.push(startAfter(cursorSnap));
      }
    }

    baseConstraints.push(limit(pageSize));

    const q = fsQuery(collection(db, this.path(uid)), ...baseConstraints);
    const snap = await getDocs(q);

    const items: BillingModel[] = snap.docs.map((invoiceDoc) =>
      toBillingDomain(invoiceDoc.id, invoiceDoc.data() as RemoteResultBillingModel)
    );

    if (sortLocally) {
      items.sort((a, b) => b.timeStamp - a.timeStamp);
    }

    const endReached = snap.docs.length < pageSize;
    const nextCursor = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1].id : null;

    return {
      items,
      nextCursor: endReached ? null : nextCursor,
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

  async getAllInvoices(uid: string): Promise<BillingModel[]> {
    const snap = await getDocs(fsQuery(collection(db, this.path(uid))));
    return snap.docs.map((d) => toBillingDomain(d.id, d.data() as RemoteResultBillingModel));
  }

  async getInvoicesByOrder(uid: string, orderIds: string[]): Promise<BillingModel[]> {
    const ids = [...new Set(orderIds.map((value) => value.trim()).filter(Boolean))].slice(0, 30);
    if (!ids.length) return [];

    const q = fsQuery(collection(db, this.path(uid)), where("Orden", "in", ids));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => toBillingDomain(d.id, d.data() as RemoteResultBillingModel))
      .sort((a, b) => b.timeStamp - a.timeStamp);
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
