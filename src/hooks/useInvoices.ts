import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getCollection } from "@/lib/firebase/firestore";
import type {
  RemoteResultBillingModel,
  InvoiceFilters,
} from "@/types/domain";
import { toBillingDomain } from "@/types/domain";

// Mirrors Kotlin BillingPaginationService — path: "users/{uid}/allBillings"
function billingsPath(uid: string): string {
  return `users/${uid}/allBillings`;
}

const PAGE_SIZE = 20;

/**
 * Build Firestore query filters for invoices
 * Mirrors Kotlin BillingPaginationService.fetchBillingsPaged()
 */
function buildInvoiceFilters(filters: InvoiceFilters) {
  const firestoreFilters: Array<{ field: string; op: "=" | "<" | "<=" | ">" | ">=" | "array-contains" | "in"; value: unknown }> = [];

  // State filter (exact match)
  if (filters.state && filters.state !== "Todas") {
    firestoreFilters.push({ field: "Estado", op: "=", value: filters.state });
  }

  // Client prefix search (using GREATER_THAN_OR_EQUAL + LESS_THAN with \uf8ff)
  if (filters.client) {
    firestoreFilters.push({
      field: "Razon Social",
      op: ">=",
      value: filters.client,
    });
    firestoreFilters.push({
      field: "Razon Social",
      op: "<",
      value: filters.client + "\uf8ff",
    });
  }

  // Number prefix search
  if (filters.number) {
    firestoreFilters.push({
      field: "Numero",
      op: ">=",
      value: filters.number,
    });
    firestoreFilters.push({
      field: "Numero",
      op: "<",
      value: filters.number + "\uf8ff",
    });
  }

  return firestoreFilters;
}

/**
 * Hook for infinite scrolling invoice list with filters
 * Mirrors Kotlin InvoiceUseCase.GetInvoicePaged.loadNextPage()
 */
export function useInvoices(filters: InvoiceFilters) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ["invoices", filters, user?.uid],
    queryFn: async ({ pageParam }) => {
      if (!user?.uid) throw new Error("No user");

      const firestoreFilters = buildInvoiceFilters(filters);

      // Determine orderBy based on active filter (matches Kotlin logic)
      let orderBy = "Timestamp";
      if (filters.client) orderBy = "Razon Social";
      if (filters.number) orderBy = "Numero";

      const docs = await getCollection<RemoteResultBillingModel>(
        billingsPath(user.uid),
        {
          filters: firestoreFilters,
          orderBy: { field: orderBy, direction: "desc" },
          limit: PAGE_SIZE + 1, // fetch one extra to detect end
          startAfter: pageParam,
        }
      );

      // Convert to domain
      const items = docs.map(toBillingDomain);

      // Check if we reached the end
      const hasMore = items.length > PAGE_SIZE;
      const pageItems = hasMore ? items.slice(0, PAGE_SIZE) : items;

      // Use timeStamp of last item as cursor
      const nextCursor = hasMore
        ? docs[PAGE_SIZE - 1][orderBy as keyof RemoteResultBillingModel]
        : null;

      return {
        items: pageItems,
        nextCursor,
        quantity: pageItems.length,
        endReached: !hasMore,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!user?.uid,
    initialPageParam: null as unknown,
  });
}

/**
 * Hook for fetching a single invoice by number
 * Mirrors Kotlin InvoiceUseCase.GetInvoiceByNumber
 */
export function useInvoice(invoiceNumber: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["invoice", invoiceNumber],
    queryFn: async () => {
      if (!invoiceNumber || !user?.uid) throw new Error("No invoice number or user");

      // Query by billingNumber field
      const docs = await getCollection<RemoteResultBillingModel>(
        billingsPath(user.uid),
        {
          filters: [{ field: "Numero", op: "=", value: invoiceNumber }],
          limit: 1,
        }
      );

      if (docs.length === 0) return null;
      return toBillingDomain(docs[0]);
    },
    enabled: !!invoiceNumber && !!user?.uid,
  });
}

/**
 * Hook for invoice states (for filter dropdown)
 */
export const INVOICE_STATES = [
  "Todas",
  "Pendiente",
  "Por vencer",
  "Vencido",
  "Cobrado",
  "Cerrada",
  "Devuelta",
  "Cancelado",
] as const;

export type InvoiceState = (typeof INVOICE_STATES)[number];