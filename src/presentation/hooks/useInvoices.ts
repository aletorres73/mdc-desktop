import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoiceUseCase } from "@/di/container";
import type { InvoiceFilters } from "@/domain/repositories/IInvoiceRepository";
import type { MovementMethod } from "@/domain/entities/paymentRegister";

export function useInvoicesPage(
  uid: string | undefined,
  filters: InvoiceFilters,
  pageSize = 20,
  cursor: string | null = null,
) {
  return useQuery({
    queryKey: ["invoices", uid, filters, pageSize, cursor],
    queryFn: () => invoiceUseCase.getInvoicesPage(uid!, filters, pageSize, cursor),
    enabled: !!uid,
  });
}

export function useInvoice(uid: string | undefined, invoiceId: string | undefined) {
  return useQuery({
    queryKey: ["invoice", uid, invoiceId],
    queryFn: () => invoiceUseCase.getInvoice(uid!, invoiceId!),
    enabled: !!uid && !!invoiceId,
  });
}

export function useCreateInvoice(uid: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (billing: Parameters<typeof invoiceUseCase.createInvoice>[1]) => invoiceUseCase.createInvoice(uid!, billing),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices", uid] }),
  });
}

export function useDeleteInvoice(uid: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) => invoiceUseCase.deleteInvoice(uid!, invoiceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices", uid] }),
  });
}

export function useUpdateInvoice(uid: string | undefined, invoiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof invoiceUseCase.updateInvoice>[2]) =>
      invoiceUseCase.updateInvoice(uid!, invoiceId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invoice", uid, invoiceId] });
      void queryClient.invalidateQueries({ queryKey: ["invoices", uid] });
    },
  });
}

export function useAddInvoiceComment(uid: string | undefined, invoiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (comment: string) => invoiceUseCase.addComment(uid!, invoiceId, comment),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoice", uid, invoiceId] }),
  });
}

export function useChangePaymentCondition(uid: string | undefined, invoiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentCondition: string) => invoiceUseCase.changePaymentCondition(uid!, invoiceId, paymentCondition),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoice", uid, invoiceId] }),
  });
}

export function useApplyInvoicePayment(uid: string | undefined, invoiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payment: { amount: number; method: MovementMethod; notes: string }) =>
      invoiceUseCase.applyInvoicePayment(uid!, invoiceId, payment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", uid, invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["paymentRegister", uid] });
    },
  });
}

export function useDeleteInvoicePayment(uid: string | undefined, invoiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (movementId: number) => invoiceUseCase.deleteInvoicePayment(uid!, invoiceId, movementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", uid, invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["paymentRegister", uid] });
    },
  });
}

export function useReconcileInvoicePayment(uid: string | undefined, invoiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (movementId: number) => invoiceUseCase.reconcileInvoicePayment(uid!, movementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", uid, invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["paymentRegister", uid] });
    },
  });
}
