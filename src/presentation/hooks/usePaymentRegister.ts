import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentRegisterUseCase } from "@/di/container";
import type { PaymentRegisterModel } from "@/domain/entities/paymentRegister";

export function usePaymentRegister(uid: string | undefined, filters?: { clientId?: string; branch?: string }) {
  return useQuery({
    queryKey: ["paymentRegister", uid, filters],
    queryFn: () => paymentRegisterUseCase.getMovements(uid!, filters),
    enabled: !!uid,
  });
}

export function useRegisterMovement(uid: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      input: Omit<PaymentRegisterModel, "id" | "isVirtual" | "status" | "reconciliationDate" | "confirmationTimestamp">,
    ) => paymentRegisterUseCase.registerMovement(uid!, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["paymentRegister", uid] }),
  });
}

export function useReconcileMovement(uid: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => paymentRegisterUseCase.reconcileMovement(uid!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["paymentRegister", uid] }),
  });
}

export function useDeleteMovement(uid: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => paymentRegisterUseCase.deleteMovement(uid!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["paymentRegister", uid] }),
  });
}
