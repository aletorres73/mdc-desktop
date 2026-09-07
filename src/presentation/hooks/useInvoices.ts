import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { invoiceUseCase } from "@/di/container";
import type { InvoiceFilters } from "@/domain/repositories/IInvoiceRepository";
import type { MovementMethod } from "@/domain/entities/paymentRegister";
import type { BillingModel } from "@/domain/entities/billing";
import type { InvoiceStateFilter } from "@/domain/logic/invoiceList";
import { normalizeInvoiceSearch } from "@/domain/logic/invoiceList";

export type InvoiceListUiState = "idle" | "loading" | "success" | "empty" | "error" | "updating";
export type InvoiceDetailUiState = "idle" | "loading" | "success" | "error" | "notFound";

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

export function useInvoicesList(
  uid: string | undefined,
  params: {
    state: InvoiceStateFilter;
    searchText: string;
    pageSize?: number;
    refreshKey?: number;
  },
) {
  const pageSize = params.pageSize ?? 20;
  const normalizedSearch = normalizeInvoiceSearch(params.searchText);
  const filters: InvoiceFilters = {
    state: params.state === "Todas" ? undefined : params.state,
    searchText: normalizedSearch || undefined,
  };

  const query = useInfiniteQuery({
    queryKey: ["invoicesList", uid, filters, pageSize, params.refreshKey ?? 0],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => invoiceUseCase.getInvoicesPage(uid!, filters, pageSize, pageParam),
    enabled: !!uid,
    getNextPageParam: (lastPage) => (lastPage.endReached ? undefined : lastPage.nextCursor),
    placeholderData: (previousData) => previousData,
  });

  const items = useMemo<BillingModel[]>(() => {
    const seen = new Set<string>();
    const merged: BillingModel[] = [];
    for (const page of query.data?.pages ?? []) {
      for (const item of page.items) {
        if (!item.id || seen.has(item.id)) continue;
        seen.add(item.id);
        merged.push(item);
      }
    }
    return merged;
  }, [query.data]);

  const uiState: InvoiceListUiState = useMemo(() => {
    if (!uid) return "idle";
    if (query.isPending && items.length === 0) return "loading";
    if (query.isError) return "error";
    if (query.isFetching && items.length > 0) return "updating";
    if (items.length === 0) return "empty";
    return "success";
  }, [uid, query.isPending, query.isError, query.isFetching, items.length]);

  return {
    ...query,
    items,
    uiState,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}

export function useInvoice(uid: string | undefined, invoiceId: string | undefined) {
  return useQuery({
    queryKey: ["invoice", uid, invoiceId],
    queryFn: () => invoiceUseCase.getInvoice(uid!, invoiceId!),
    enabled: !!uid && !!invoiceId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useInvoiceDetail(uid: string | undefined, invoiceId: string | undefined) {
  const query = useInvoice(uid, invoiceId);
  const uiState: InvoiceDetailUiState = useMemo(() => {
    if (!uid || !invoiceId) return "idle";
    if (query.isPending) return "loading";
    if (query.isError) return "error";
    if (!query.data) return "notFound";
    return "success";
  }, [uid, invoiceId, query.isPending, query.isError, query.data]);

  return {
    ...query,
    uiState,
    retry: query.refetch,
  };
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", uid, invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoices", uid] });
      queryClient.invalidateQueries({ queryKey: ["invoicesList", uid] });
    },
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
