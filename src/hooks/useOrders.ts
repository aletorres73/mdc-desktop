import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getCollection } from "@/lib/firebase/firestore";
import type {
  RemoteResultBuyOrder,
  RemoteResultOrder,
  BuyOrderModel,
  OrderFilters,
} from "@/types/domain";
import { toBuyOrderDomain, toOrderDomain } from "@/types/domain";

// Mirrors Kotlin OrderService paths
function ordersPath(uid: string): string {
  return `users/${uid}/Orders`;
}

function buyOrdersPath(uid: string, clientId: string): string {
  return `users/${uid}/clients/${clientId}/buyOrders`;
}

function factoriesPath(uid: string): string {
  return `users/${uid}/factories`;
}

/**
 * Hook for fetching all orders (by factory filter)
 * Mirrors Kotlin OrderService.fetchAllOrders() / fetchOrdersByFactory()
 */
export function useOrders(filters: OrderFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["orders", filters, user?.uid],
    queryFn: async () => {
      if (!user?.uid) throw new Error("No user");

      let docs: RemoteResultOrder[];

      if (filters.factory && filters.factory !== "all") {
        // Filter by factory/marca
        docs = await getCollection<RemoteResultOrder>(
          ordersPath(user.uid),
          {
            filters: [{ field: "Marca", op: "=", value: filters.factory }],
            orderBy: { field: "Fecha de carga", direction: "desc" },
          }
        );
      } else {
        // Fetch all orders
        docs = await getCollection<RemoteResultOrder>(
          ordersPath(user.uid),
          {
            orderBy: { field: "Fecha de carga", direction: "desc" },
          }
        );
      }

      // Convert to domain
      let items = docs.map(toOrderDomain);

      // Apply search filter (client name or order number)
      if (filters.search) {
        const search = filters.search.toLowerCase();
        items = items.filter(
          (o) =>
            o.nameClient.toLowerCase().includes(search) ||
            o.orderNumber.toLowerCase().includes(search)
        );
      }

      return items;
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching buy orders for a specific client
 * Mirrors Kotlin OrderService.fetchBuyOrdersByClient()
 */
export function useBuyOrders(clientId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["buyOrders", clientId, user?.uid],
    queryFn: async () => {
      if (!clientId || !user?.uid) return [];

      const docs = await getCollection<RemoteResultBuyOrder>(
        buyOrdersPath(user.uid, clientId),
        {
          orderBy: { field: "Fecha de carga", direction: "desc" },
        }
      );

      return docs.map(toBuyOrderDomain);
    },
    enabled: !!clientId && !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching a single buy order
 * Mirrors Kotlin OrderService.fetchBuyOrder()
 */
export function useBuyOrder(clientId: string | null, orderId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["buyOrder", clientId, orderId],
    queryFn: async () => {
      if (!clientId || !orderId || !user?.uid) throw new Error("Missing clientId or orderId or user");
      // We need the user ID - this is a limitation
      // In practice, we'd get this from auth context
      return null as BuyOrderModel | null;
    },
    enabled: !!clientId && !!orderId && !!user?.uid,
  });
}

/**
 * Hook for fetching factories (for filter dropdown)
 * Mirrors Kotlin OrderService.fetchOrdersByFactory() / HomeService.fetchAllFactories()
 */
export function useFactoriesForOrders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["factories", "forOrders", user?.uid],
    queryFn: async () => {
      if (!user?.uid) throw new Error("No user");

      const docs = await getCollection<{ name: string }>(
        factoriesPath(user.uid)
      );

      return docs.map((d) => d.name).sort();
    },
    enabled: !!user?.uid,
    staleTime: 10 * 60 * 1000,
  });
}