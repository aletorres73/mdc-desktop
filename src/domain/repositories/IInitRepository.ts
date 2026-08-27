import type { RemoteInitConfig } from "../entities/user";

export interface IInitRepository {
  getLatestConfig(): Promise<RemoteInitConfig>;
}
