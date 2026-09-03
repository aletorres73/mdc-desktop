import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { container } from "@/di/container";
import type { InvoiceFilters, BillingModel } from "@/domain/entities/invoice";
import type { PaymentCondition } from "@/domain/entities/factory";
import type { InvoicePaymentInput } from "@/domain/logic/recalculate";

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

export function useUpdateInvoiceDetails() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ billing, updates }: { billing: BillingModel; updates: Partial<BillingModel> }) => {
      if (!user?.uid) throw new Error("No user");
      return container.invoiceUseCase.updateInvoiceDetails(user.uid, billing, updates);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["invoice", user?.uid, updated.billingNumber] });
    },
  });
}

export function useAddInvoiceComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ billing, comment }: { billing: BillingModel; comment: string }) => {
      if (!user?.uid) throw new Error("No user");
      return container.invoiceUseCase.addInvoiceComment(user.uid, billing, comment);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["invoice", user?.uid, updated.billingNumber] });
    },
  });
}

export function useApplyInvoicePayment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ billing, payment }: { billing: BillingModel; payment: InvoicePaymentInput }) => {
      if (!user?.uid) throw new Error("No user");
      return container.invoiceUseCase.applyInvoicePayment(user.uid, billing, payment);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["invoice", user?.uid, updated.billingNumber] });
    },
  });
}

export function useUpdateInvoicePayment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      billing,
      paymentIndex,
      changes,
    }: {
      billing: BillingModel;
      paymentIndex: number;
      changes: Partial<InvoicePaymentInput & { amount: number; status: string; note?: string }>;
    }) => {
      if (!user?.uid) throw new Error("No user");
      return container.invoiceUseCase.updateInvoicePayment(user.uid, billing, paymentIndex, changes);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["invoice", user?.uid, updated.billingNumber] });
    },
  });
}

export function useDeleteInvoicePayment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ billing, paymentIndex }: { billing: BillingModel; paymentIndex: number }) => {
      if (!user?.uid) throw new Error("No user");
      return container.invoiceUseCase.deleteInvoicePayment(user.uid, billing, paymentIndex);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["invoice", user?.uid, updated.billingNumber] });
    },
  });
}

export function useReconcileInvoicePayment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ billing, paymentIndex }: { billing: BillingModel; paymentIndex: number }) => {
      if (!user?.uid) throw new Error("No user");
      return container.invoiceUseCase.reconcileInvoicePayment(user.uid, billing, paymentIndex);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["invoice", user?.uid, updated.billingNumber] });
    },
  });
}

export function useChangePaymentCondition() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ billing, condition }: { billing: BillingModel; condition: PaymentCondition | null }) => {
      if (!user?.uid) throw new Error("No user");
      return container.invoiceUseCase.changePaymentCondition(user.uid, billing, condition);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["invoice", user?.uid, updated.billingNumber] });
    },
  });
}

export function useDeleteInvoice() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (billingNumber: string) => {
      if (!user?.uid) throw new Error("No user");
      return container.invoiceUseCase.deleteInvoice(user.uid, billingNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", user?.uid] });
    },
  });
}

