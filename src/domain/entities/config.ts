export interface RemoteInitConfig {
  apkUrl: string;
  enable: boolean;
  minSupported: string;
  releaseNotes: string;
  versionCode: number;
  versionName: string;
}

export type UpdateState = "OK" | "OPTIONAL_UPDATE" | "FORCE_UPDATE";
