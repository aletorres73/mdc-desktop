import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { buyOrderUseCase, createInvoiceFromOrderUseCase } from "@/di/container";
import type { BuyOrderModel } from "@/domain/entities/buyOrder";

export function useBuyOrders(uid: string | undefined, clientId: string | undefined) {
  return useQuery({
    queryKey: ["buyOrders", uid, clientId],
    queryFn: () => buyOrderUseCase.getByClient(uid!, clientId!),
    enabled: !!uid && !!clientId,
  });
}

export function useAllBuyOrders(uid: string | undefined) {
  return useQuery({
    queryKey: ["allBuyOrders", uid],
    queryFn: () => buyOrderUseCase.getAll(uid!),
    enabled: !!uid,
  });
}

export function useBuyOrder(uid: string | undefined, clientId: string | undefined, orderId: string | undefined) {
  return useQuery({
    queryKey: ["buyOrder", uid, clientId, orderId],
    queryFn: () => buyOrderUseCase.getOrder(uid!, clientId!, orderId!),
    enabled: !!uid && !!clientId && !!orderId,
  });
}

export function useCreateBuyOrder(uid: string | undefined, clientId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: Omit<BuyOrderModel, "id" | "order">) => buyOrderUseCase.createOrder(uid!, order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyOrders", uid, clientId] });
      queryClient.invalidateQueries({ queryKey: ["allBuyOrders", uid] });
    },
  });
}

export function useUpdateBuyOrder(uid: string | undefined, clientId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: BuyOrderModel) => buyOrderUseCase.updateOrder(uid!, order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyOrders", uid, clientId] });
      queryClient.invalidateQueries({ queryKey: ["allBuyOrders", uid] });
    },
  });
}

export function useDeleteBuyOrder(uid: string | undefined, clientId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => buyOrderUseCase.deleteOrder(uid!, clientId!, orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyOrders", uid, clientId] });
      queryClient.invalidateQueries({ queryKey: ["allBuyOrders", uid] });
    },
  });
}

export function useCreateInvoiceFromOrder(uid: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, orderId, billingNumber }: { clientId: string; orderId: string; billingNumber: string }) =>
      createInvoiceFromOrderUseCase.execute(uid!, clientId, orderId, billingNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orderInvoices", uid] });
      queryClient.invalidateQueries({ queryKey: ["invoicesList", uid] });
      queryClient.invalidateQueries({ queryKey: ["allInvoices", uid] });
    },
  });
}
