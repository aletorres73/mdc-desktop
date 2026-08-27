import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { container } from "@/di/container";

export function useCommissions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["commissions", user?.uid],
    queryFn: async () => {
      if (!user?.uid) throw new Error("No user");
      return container.commissionsUseCase.getCommissionsSummary(user.uid);
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });
}
