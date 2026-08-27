import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { container } from "@/di/container";
import type { FactoryModel, PaymentCondition } from "@/domain/entities/factory";

export function useFactories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["factories", user?.uid],
    queryFn: async () => {
      if (!user?.uid) throw new Error("No user");
      return container.factoryUseCase.getAllFactories(user.uid);
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFactory(factoryName: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["factory", user?.uid, factoryName],
    queryFn: async () => {
      if (!user?.uid || !factoryName) return null;
      return container.factoryUseCase.getFactoryByName(user.uid, factoryName);
    },
    enabled: !!user?.uid && !!factoryName,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFactoryPaymentConditions(factoryName: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["factoryPaymentConditions", user?.uid, factoryName],
    queryFn: async () => {
      if (!user?.uid || !factoryName) return [];
      const factory = await container.factoryUseCase.getFactoryByName(user.uid, factoryName);
      return factory?.paymentType ?? [];
    },
    enabled: !!user?.uid && !!factoryName,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateFactory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (factory: FactoryModel) => {
      if (!user?.uid) throw new Error("No user");
      return container.factoryUseCase.createFactory(user.uid, factory);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factories", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["homeStats", user?.uid] });
    },
  });
}

export function useUpdateFactory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (factory: FactoryModel) => {
      if (!user?.uid) throw new Error("No user");
      return container.factoryUseCase.updateFactory(user.uid, factory);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["factories", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["factory", user?.uid, updated.name] });
      queryClient.invalidateQueries({ queryKey: ["homeStats", user?.uid] });
    },
  });
}

export function useUpdateFactoryPaymentConditions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      factoryName,
      paymentConditions,
    }: {
      factoryName: string;
      paymentConditions: PaymentCondition[];
    }) => {
      if (!user?.uid) throw new Error("No user");
      await container.factoryUseCase.updatePaymentConditions(user.uid, factoryName, paymentConditions);
      return { factoryName, paymentConditions };
    },
    onSuccess: ({ factoryName }) => {
      queryClient.invalidateQueries({ queryKey: ["factories", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["factory", user?.uid, factoryName] });
      queryClient.invalidateQueries({ queryKey: ["factoryPaymentConditions", user?.uid, factoryName] });
    },
  });
}

export function useDeleteFactory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (factoryName: string) => {
      if (!user?.uid) throw new Error("No user");
      return container.factoryUseCase.deleteFactory(user.uid, factoryName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factories", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["homeStats", user?.uid] });
    },
  });
}
