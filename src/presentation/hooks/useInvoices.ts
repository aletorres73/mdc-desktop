import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { container } from "@/di/container";
import type { InvoiceFilters, BillingModel } from "@/domain/entities/invoice";
import type { PaymentCondition } from "@/domain/entities/factory";

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

export function useInvoices(filters: InvoiceFilters) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ["invoices", user?.uid, filters],
    queryFn: async ({ pageParam }) => {
      if (!user?.uid) throw new Error("No user");
      return container.invoiceUseCase.getPaginatedInvoices(user.uid, filters, pageParam);
    },
    initialPageParam: null as unknown,
    getNextPageParam: (lastPage) => (lastPage.endReached ? undefined : lastPage.nextCursor),
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });
}

export function useInvoice(invoiceNumber: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["invoice", user?.uid, invoiceNumber],
    queryFn: async () => {
      if (!user?.uid || !invoiceNumber) return null;
      return container.invoiceUseCase.getInvoiceByNumber(user.uid, invoiceNumber);
    },
    enabled: !!user?.uid && !!invoiceNumber,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecalculateInvoice() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ billing, condition }: { billing: BillingModel; condition?: PaymentCondition | null }) => {
      if (!user?.uid) throw new Error("No user");
      return container.invoiceUseCase.recalculateAndSaveInvoice(user.uid, billing, condition);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["invoice", user?.uid, updated.billingNumber] });
    },
  });
}
