import { useQuery } from "@tanstack/react-query";
import { commissionUseCase } from "@/di/container";

export function useCommissionSummary(uid: string | undefined) {
  return useQuery({
    queryKey: ["commissions", uid],
    queryFn: () => commissionUseCase.getCommissionSummary(uid!),
    enabled: !!uid,
  });
}
