import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { factoryUseCase } from "@/di/container";
import type { FactoryModel } from "@/domain/entities/factory";

export function useFactories(uid: string | undefined) {
  return useQuery({
    queryKey: ["factories", uid],
    queryFn: () => factoryUseCase.getFactories(uid!),
    enabled: !!uid,
  });
}

export function useFactory(uid: string | undefined, name: string | undefined) {
  return useQuery({
    queryKey: ["factory", uid, name],
    queryFn: () => factoryUseCase.getFactoryByName(uid!, name!),
    enabled: !!uid && !!name,
  });
}

export function useCreateFactory(uid: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (factory: FactoryModel) => factoryUseCase.createFactory(uid!, factory),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["factories", uid] }),
  });
}

export function useUpdateFactory(uid: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Partial<FactoryModel> }) =>
      factoryUseCase.updateFactory(uid!, name, data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["factories", uid] });
      void queryClient.invalidateQueries({ queryKey: ["factory", uid, variables.name] });
    },
  });
}

export function useDeleteFactory(uid: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => factoryUseCase.deleteFactory(uid!, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["factories", uid] }),
  });
}
