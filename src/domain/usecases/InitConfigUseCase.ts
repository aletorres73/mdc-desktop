import type { IInitRepository } from "../repositories/IInitRepository";
import type { RemoteInitConfig } from "../entities/user";

export class InitConfigUseCase {
  constructor(private initRepo: IInitRepository) {}

  async getLatestConfig(): Promise<RemoteInitConfig> {
    return this.initRepo.getLatestConfig();
  }
}
