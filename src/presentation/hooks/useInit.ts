import { useQuery } from "@tanstack/react-query";
import { container } from "@/di/container";

export function useInit() {
  return useQuery({
    queryKey: ["appInit"],
    queryFn: async () => {
      return container.initConfigUseCase.getLatestConfig();
    },
    staleTime: 10 * 60 * 1000,
  });
}
