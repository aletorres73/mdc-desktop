import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { container } from "@/di/container";

export function useHomeStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["homeStats", user?.uid],
    queryFn: async () => {
      if (!user?.uid) throw new Error("No user");
      return container.homeUseCase.getDashboardStats(user.uid);
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });
}
