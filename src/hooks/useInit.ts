import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getCollection } from "@/lib/firebase/firestore";
import type { RemoteInitConfig } from "@/types/domain";

// Mirrors Kotlin InitService — loads app config from "appConfig/android/releases"
const INIT_PATH = "appConfig/android/releases";

/**
 * Hook to load app initialization config from Firestore.
 * Mirrors Kotlin InitConfigUseCase → InitService.init()
 */
export function useInit() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["init-config"],
    queryFn: async () => {
      if (!user?.uid) throw new Error("No user");

      const docs = await getCollection<RemoteInitConfig>(
        INIT_PATH
      );

      // Sort by versionCode descending, take the first (latest)
      const sorted = docs.sort((a, b) => (b.versionCode ?? 0) - (a.versionCode ?? 0));
      const latest = sorted[0] ?? {
        apkUrl: "",
        enable: true,
        minSupported: "",
        releaseNotes: "",
        versionCode: 0,
        versionName: "",
      };

      return latest;
    },
    enabled: !!user?.uid,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
