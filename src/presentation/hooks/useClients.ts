import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { container } from "@/di/container";
import type { ClientFilters, ClientModel } from "@/domain/entities/client";

const PAGE_SIZE = 20;

export function useClients(filters: ClientFilters) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ["clients", user?.uid, filters],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.uid) throw new Error("No user");
      const filtered = await container.clientUseCase.searchClients(user.uid, filters);
      const pageOffset = pageParam as number;
      const pageItems = filtered.slice(pageOffset, pageOffset + PAGE_SIZE);
      const hasMore = pageOffset + PAGE_SIZE < filtered.length;
      return {
        items: pageItems,
        nextCursor: hasMore ? pageOffset + PAGE_SIZE : null,
        hasMore,
        totalCount: filtered.length,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllClients() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["allClients", user?.uid],
    queryFn: async () => {
      if (!user?.uid) throw new Error("No user");
      return container.clientUseCase.getAllClients(user.uid);
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });
}

export function useClient(clientId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client", user?.uid, clientId],
    queryFn: async () => {
      if (!user?.uid || !clientId) return null;
      return container.clientUseCase.getClientById(user.uid, clientId);
    },
    enabled: !!user?.uid && !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateClient() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (client: ClientModel) => {
      if (!user?.uid) throw new Error("No user");
      return container.clientUseCase.createClient(user.uid, client);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["allClients", user?.uid] });
    },
  });
}

export function useUpdateClient() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (client: ClientModel) => {
      if (!user?.uid) throw new Error("No user");
      return container.clientUseCase.updateClient(user.uid, client);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["clients", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["allClients", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["client", user?.uid, updated.clientId] });
    },
  });
}

export function useDeleteClient() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      if (!user?.uid) throw new Error("No user");
      return container.clientUseCase.deleteClient(user.uid, clientId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["allClients", user?.uid] });
    },
  });
}
