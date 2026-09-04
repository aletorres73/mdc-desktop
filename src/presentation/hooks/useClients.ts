import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientUseCase } from "@/di/container";
import type { ClientModel } from "@/domain/entities/client";

export function useClients(uid: string | undefined, search = "") {
  return useQuery({
    queryKey: ["clients", uid, search],
    queryFn: () => clientUseCase.searchByPrefix(uid!, search),
    enabled: !!uid,
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
    mutationFn: (clientName: string) => clientUseCase.createClient(uid!, clientName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients", uid] }),
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
