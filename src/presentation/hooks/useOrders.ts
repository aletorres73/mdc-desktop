import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { container } from "@/di/container";
import type { BuyOrderModel, OrderFilters } from "@/domain/entities/order";

export function useOrders(filters: OrderFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["orders", user?.uid, filters],
    queryFn: async () => {
      if (!user?.uid) throw new Error("No user");
      return container.ordersUseCase.getOrders(user.uid, filters);
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBuyOrders(clientId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["buyOrders", user?.uid, clientId],
    queryFn: async () => {
      if (!user?.uid || !clientId) return [];
      return container.ordersUseCase.getBuyOrders(user.uid, clientId);
    },
    enabled: !!user?.uid && !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBuyOrder(clientId: string | null, orderId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["buyOrder", user?.uid, clientId, orderId],
    queryFn: async () => {
      if (!user?.uid || !clientId || !orderId) return null;
      return container.ordersUseCase.getBuyOrder(user.uid, clientId, orderId);
    },
    enabled: !!user?.uid && !!clientId && !!orderId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFactoriesForOrders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["orderFactories", user?.uid],
    queryFn: async () => {
      if (!user?.uid) throw new Error("No user");
      return container.ordersUseCase.getFactoryNames(user.uid);
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBuyOrder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, order }: { clientId: string; order: BuyOrderModel }) => {
      if (!user?.uid) throw new Error("No user");
      return container.ordersUseCase.createBuyOrder(user.uid, clientId, order);
    },
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: ["buyOrders", user?.uid, clientId] });
      queryClient.invalidateQueries({ queryKey: ["orders", user?.uid] });
    },
  });
}
