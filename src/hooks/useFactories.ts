import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getCollection, addDocument, updateDocument, deleteDocument } from "@/data/datasources/firestore";
import type {
  RemoteResultFactoryModel,
  FactoryModel,
  PaymentCondition,
} from "@/types/domain";

// Mirrors Kotlin HomeService/OrderService — path: "users/{uid}/factories"
function factoriesPath(uid: string): string {
  return `users/${uid}/factories`;
}

/**
 * Convert RemoteResultFactoryModel (Firestore format) → FactoryModel (domain)
 * Mirrors Kotlin RemoteResultFactoryModel.toFactoryDomain()
 */
function toPaymentConditions(
  conditions: RemoteResultFactoryModel["Condiciones"] | null | undefined
): PaymentCondition[] {
  return Object.values(conditions ?? {}).map((cond) => ({
    paymentName: cond.condicion ?? "Sin condición",
    discount: parseFloat(cond.dto ?? "0"),
    month: parseInt(cond.meses ?? "0"),
    expiration: parseInt(cond.vencimiento ?? "0"),
    date: parseInt(cond.plazo ?? "0"),
    quantity: parseInt(cond.pagos ?? "0"),
  }));
}

function toFactoryDomain(remote: RemoteResultFactoryModel): FactoryModel {
  const paymentType = toPaymentConditions(remote.Condiciones);

  return {
    name: remote.Fabrica,
    branchList: remote.Marcas ?? [],
    paymentType,
    defaultCommission: remote.ComisionBase ?? 0,
    segmentCommissions: remote.ComisionesSegmento ?? {},
  };
}

/**
 * Convert FactoryModel (domain) → RemoteResultFactoryModel (Firestore format)
 * Mirrors Kotlin FactoryModel.toFactoryRemote()
 */
function toFactoryRemote(factory: FactoryModel): RemoteResultFactoryModel {
  const condiciones: Record<string, Record<string, string>> = {};
  factory.paymentType.forEach((pc, index) => {
    condiciones[`condicion${index + 1}`] = {
      condicion: pc.paymentName,
      dto: pc.discount.toString(),
      meses: pc.month.toString(),
      vencimiento: pc.expiration.toString(),
      plazo: pc.date.toString(),
      pagos: pc.quantity.toString(),
    };
  });

  return {
    Fabrica: factory.name,
    Marcas: factory.branchList,
    Condiciones: condiciones,
    ComisionBase: factory.defaultCommission,
    ComisionesSegmento: factory.segmentCommissions,
  };
}

/**
 * Hook for fetching all factories for the current user
 * Mirrors Kotlin HomeService.fetchAllFactories() → HomeViewModel
 */
export function useFactories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["factories", user?.uid],
    queryFn: async () => {
      if (!user?.uid) throw new Error("No user");

      const docs = await getCollection<RemoteResultFactoryModel>(
        factoriesPath(user.uid)
      );

      // Convert to domain and sort by branchList size descending (matches Kotlin)
      return docs
        .map(toFactoryDomain)
        .sort((a, b) => b.branchList.length - a.branchList.length);
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching a single factory by name
 * Mirrors Kotlin OrderService.fetchPaymentsTypesFactory()
 */
export function useFactory(factoryName: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["factory", factoryName, user?.uid],
    queryFn: async () => {
      if (!factoryName || !user?.uid) throw new Error("No factory name or user");

      const docs = await getCollection<RemoteResultFactoryModel>(
        factoriesPath(user.uid),
        {
          filters: [{ field: "Fabrica", op: "=", value: factoryName }],
          limit: 1,
        }
      );

      if (docs.length === 0) return null;
      return toFactoryDomain(docs[0]);
    },
    enabled: !!factoryName && !!user?.uid,
  });
}

/**
 * Hook for fetching payment conditions for a factory
 * Mirrors Kotlin OrderService.fetchPaymentsTypesFactory()
 */
export function useFactoryPaymentConditions(factoryName: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["factoryPaymentConditions", factoryName, user?.uid],
    queryFn: async () => {
      if (!factoryName || !user?.uid) return [];

      const docs = await getCollection<RemoteResultFactoryModel>(
        factoriesPath(user.uid),
        {
          filters: [{ field: "Fabrica", op: "=", value: factoryName }],
          limit: 1,
        }
      );

      if (docs.length === 0) return [];

      const remote = docs[0];
      return toPaymentConditions(remote.Condiciones);
    },
    enabled: !!factoryName && !!user?.uid,
  });
}

/**
 * Mutation for creating a new factory
 */
export function useCreateFactory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (factory: FactoryModel) => {
      if (!user?.uid) throw new Error("No user");

      const remote = toFactoryRemote(factory);
      const newId = await addDocument(
        factoriesPath(user.uid),
        remote as unknown as Record<string, unknown>
      );

      // Update the document with the generated ID as the factory name
      await updateDocument(
        factoriesPath(user.uid),
        newId,
        { Fabrica: factory.name }
      );

      return { ...factory, name: factory.name };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factories"] });
    },
  });
}

/**
 * Mutation for updating a factory
 */
export function useUpdateFactory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (factory: FactoryModel) => {
      if (!user?.uid) throw new Error("No user");

      const remote = toFactoryRemote(factory);
      await updateDocument(
        factoriesPath(user.uid),
        factory.name,
        remote as unknown as Record<string, unknown>
      );

      return factory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factories"] });
    },
  });
}

/**
 * Mutation for updating only payment conditions of a factory
 * Mirrors Kotlin OrderService.setPaymentsConditionsFactory()
 */
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

      // Convert payment conditions to Firestore format
      const condiciones: Record<string, Record<string, string>> = {};
      paymentConditions.forEach((pc, index) => {
        condiciones[`condicion${index + 1}`] = {
          condicion: pc.paymentName,
          dto: pc.discount.toString(),
          meses: pc.month.toString(),
          vencimiento: pc.expiration.toString(),
          plazo: pc.date.toString(),
          pagos: pc.quantity.toString(),
        };
      });

      await updateDocument(
        factoriesPath(user.uid),
        factoryName,
        { Condiciones: condiciones }
      );

      return { factoryName, paymentConditions };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factories"] });
      queryClient.invalidateQueries({ queryKey: ["factoryPaymentConditions"] });
    },
  });
}

/**
 * Mutation for deleting a factory
 */
export function useDeleteFactory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (factoryName: string) => {
      if (!user?.uid) throw new Error("No user");

      await deleteDocument(factoriesPath(user.uid), factoryName);
      return factoryName;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factories"] });
    },
  });
}