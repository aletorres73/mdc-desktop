import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { container } from "@/di/container";
import type { UserModel } from "@/domain/entities/user";

export function useUserProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["userProfile", user?.uid],
    queryFn: async () => {
      if (!user?.uid) throw new Error("No user");
      return container.userUseCase.getUserProfile(user.uid);
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateUserProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<UserModel>) => {
      if (!user?.uid) throw new Error("No user");
      await container.userUseCase.updateUserProfile(user.uid, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", user?.uid] });
    },
  });
}
