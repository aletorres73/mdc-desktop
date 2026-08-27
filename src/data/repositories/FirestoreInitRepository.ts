import type { IInitRepository } from "@/domain/repositories/IInitRepository";
import type { RemoteInitConfig } from "@/domain/entities/user";
import { getCollection } from "../datasources";

const INIT_PATH = "appConfig/android/releases";

export class FirestoreInitRepository implements IInitRepository {
  async getLatestConfig(): Promise<RemoteInitConfig> {
    const docs = await getCollection<RemoteInitConfig>(INIT_PATH);
    if (docs.length === 0) {
      return {
        apkUrl: "",
        enable: true,
        minSupported: "1.0.0",
        releaseNotes: "",
        versionCode: 1,
        versionName: "1.0.0",
      };
    }
    const sorted = [...docs].sort((a, b) => b.versionCode - a.versionCode);
    return sorted[0];
  }
}
