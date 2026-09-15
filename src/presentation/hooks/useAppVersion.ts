import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";

export function useAppVersion() {
  const [version, setVersion] = useState<string>(__APP_VERSION__);

  useEffect(() => {
    if ("__TAURI_INTERNALS__" in window) {
      getVersion()
        .then((v) => setVersion(v))
        .catch(() => {
          // Fallback to __APP_VERSION__
        });
    }
  }, []);

  return version;
}
