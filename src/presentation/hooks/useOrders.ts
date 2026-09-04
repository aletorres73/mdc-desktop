import { useQuery } from "@tanstack/react-query";
import { orderUseCase } from "@/di/container";

export function useOrders(uid: string | undefined) {
  return useQuery({
    queryKey: ["orders", uid],
    queryFn: () => orderUseCase.getOrders(uid!),
    enabled: !!uid,
  });
}
