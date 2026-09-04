import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientUseCase } from "@/di/container";
import type { ClientModel } from "@/domain/entities/client";

export function useClients(uid: string | undefined, search = "") {
  return useQuery({
    queryKey: ["clients", uid],
    queryFn: () => clientUseCase.getClients(uid!),
    enabled: !!uid,
    // Búsqueda local case-insensitive sobre la lista ya descargada.
    select: (data) => {
      const q = search.trim().toLowerCase();
      if (!q) return data;
      return data.filter(
        (c) => c.clientName.toLowerCase().includes(q) || c.clientId.toLowerCase().includes(q),
      );
    },
  });
}

export function useSuggestedClientId(uid: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["suggestedClientId", uid],
    queryFn: () => clientUseCase.suggestNextClientId(uid!),
    enabled: !!uid && enabled,
    staleTime: 0,
  });
}

export function useClient(uid: string | undefined, clientId: string | undefined) {
  return useQuery({
    queryKey: ["client", uid, clientId],
    queryFn: () => clientUseCase.getClient(uid!, clientId!),
    enabled: !!uid && !!clientId,
  });
}

export function useCreateClient(uid: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientName, clientId }: { clientName: string; clientId?: string }) =>
      clientUseCase.createClient(uid!, clientName, clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", uid] });
      queryClient.invalidateQueries({ queryKey: ["suggestedClientId", uid] });
    },
  });
}

export function useDeleteClient(uid: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) => clientUseCase.deleteClient(uid!, clientId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients", uid] }),
  });
}

export function useUpdateClient(uid: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, data }: { clientId: string; data: Partial<ClientModel> }) =>
      clientUseCase.updateClient(uid!, clientId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients", uid] }),
  });
}
