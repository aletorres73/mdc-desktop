import { useQuery } from "@tanstack/react-query";
import { commissionUseCase } from "@/di/container";
import type { CommissionFilters } from "@/domain/usecases/CommissionUseCase";

export function useCommissionSummary(uid: string | undefined, filters: CommissionFilters = {}) {
  const normalizedFilters = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== ""),
  );

  return useQuery({
    queryKey: ["commissions", uid, normalizedFilters],
    queryFn: () => commissionUseCase.getCommissionSummary(uid!, undefined, filters),
    enabled: !!uid,
  });
}

export function useAllCommissionSummary(uid: string | undefined) {
  return useCommissionSummary(uid);
}
