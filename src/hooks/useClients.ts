import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getCollection, getDocument, addDocument, updateDocument, deleteDocument } from "@/lib/firebase/firestore";
import type {
  RemoteResultClientModel,
  ClientModel,
  ClientFilters,
} from "@/types/domain";
import { toClientDomain } from "@/types/domain";

// Mirrors Kotlin ClientService — path: "users/{uid}/clients"
function clientsPath(uid: string): string {
  return `users/${uid}/clients`;
}

const PAGE_SIZE = 15;

/**
 * Hook for infinite scrolling client list with search
 * Mirrors Kotlin GetClientsUseCase → ClientService.fetchClientsPaged()
 */
export function useClients(filters: ClientFilters) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ["clients", filters, user?.uid],
    queryFn: async () => {
      if (!user?.uid) throw new Error("No user");

      // Fetch all clients and filter client-side (matches Kotlin approach)
      // For better performance with large datasets, we'd need Firestore queries
      const docs = await getCollection<RemoteResultClientModel>(
        clientsPath(user.uid)
      );

      // Convert to domain and sort by name (matches Kotlin)
      const items = docs
        .map(toClientDomain)
        .sort((a, b) => a.clientName.localeCompare(b.clientName));

      // Apply search filter
      const filtered = filters.search
        ? items.filter((c) =>
            c.clientName.toLowerCase().includes(filters.search.toLowerCase())
          )
        : items;

      // Simple pagination - return first PAGE_SIZE for now
      // In a real app, we'd use Firestore cursors
      const pageItems = filtered.slice(0, PAGE_SIZE);
      const hasMore = filtered.length > PAGE_SIZE;

      return {
        items: pageItems,
        nextCursor: hasMore ? String(PAGE_SIZE) : null,
        hasMore,
        totalCount: filtered.length,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!user?.uid,
    initialPageParam: null as string | null,
  });
}

/**
 * Hook for fetching all clients (for dropdowns, etc.)
 * Mirrors Kotlin GetClientsUseCase.getAll()
 */
export function useAllClients() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["clients", "all", user?.uid],
    queryFn: async () => {
      if (!user?.uid) throw new Error("No user");

      const docs = await getCollection<RemoteResultClientModel>(
        clientsPath(user.uid)
      );

      return docs.map(toClientDomain).sort((a, b) =>
        a.clientName.localeCompare(b.clientName)
      );
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching a single client by ID
 * Mirrors Kotlin ClientService.fetchClientName()
 */
export function useClient(clientId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      if (!clientId || !user?.uid) throw new Error("No client ID or user");
      const document = await getDocument<RemoteResultClientModel>(
        clientsPath(user.uid),
        clientId
      );
      if (document) return toClientDomain(document);

      const matches = await getCollection<RemoteResultClientModel>(
        clientsPath(user.uid),
        { filters: [{ field: "Cliente Id", op: "=", value: clientId }], limit: 1 }
      );
      return matches.length > 0 ? toClientDomain(matches[0]) : null;
    },
    enabled: !!clientId && !!user?.uid,
  });
}

/**
 * Mutation for creating a new client
 * Mirrors Kotlin GetClientsUseCase.save()
 */
export function useCreateClient() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (client: Omit<ClientModel, "clientId">) => {
      if (!user?.uid) throw new Error("No user");

      const remoteClient: RemoteResultClientModel = {
        "Cliente Id": "", // Will be set by Firestore
        "Razón Social": client.clientName,
      };

      const newId = await addDocument(
        clientsPath(user.uid),
        remoteClient as unknown as Record<string, unknown>
      );

      // Update the document with the generated ID
      await updateDocument(
        clientsPath(user.uid),
        newId,
        { "Cliente Id": newId }
      );

      return { ...client, clientId: newId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

/**
 * Mutation for updating a client
 */
export function useUpdateClient() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (client: ClientModel) => {
      if (!user?.uid) throw new Error("No user");

      const remoteClient: RemoteResultClientModel = {
        "Cliente Id": client.clientId,
        "Razón Social": client.clientName,
      };

      await updateDocument(
        clientsPath(user.uid),
        client.clientId,
        remoteClient as unknown as Record<string, unknown>
      );

      return client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

/**
 * Mutation for deleting a client
 * Mirrors Kotlin GetClientsUseCase.delete()
 */
export function useDeleteClient() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      if (!user?.uid) throw new Error("No user");

      await deleteDocument(clientsPath(user.uid), clientId);
      return clientId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}