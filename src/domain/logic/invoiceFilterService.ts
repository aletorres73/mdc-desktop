import type { InvoiceFilters } from "../entities/invoice";

export interface FirestoreQueryFilter {
  field: string;
  op: string;
  value: unknown;
}

export class InvoiceFilterService {
  static buildFilters(filters: InvoiceFilters): FirestoreQueryFilter[] {
    const result: FirestoreQueryFilter[] = [];

    if (filters.state && filters.state !== "Todas") {
      result.push({ field: "Estado", op: "=", value: filters.state });
    }

    if (filters.client && filters.client.trim() !== "") {
      const query = filters.client.trim();
      result.push({ field: "Razon Social", op: ">=", value: query });
      result.push({ field: "Razon Social", op: "<=", value: query + "\uf8ff" });
    } else if (filters.number && filters.number.trim() !== "") {
      const query = filters.number.trim();
      result.push({ field: "Numero", op: ">=", value: query });
      result.push({ field: "Numero", op: "<=", value: query + "\uf8ff" });
    }

    return result;
  }

  static determineOrderBy(filters: InvoiceFilters): { field: string; direction: "asc" | "desc" } {
    if (filters.client && filters.client.trim() !== "") {
      return { field: "Razon Social", direction: "asc" };
    }
    if (filters.number && filters.number.trim() !== "") {
      return { field: "Numero", direction: "asc" };
    }
    return { field: "Timestamp", direction: "desc" };
  }
}
