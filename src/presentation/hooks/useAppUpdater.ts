import { useState, useEffect, useCallback, useRef } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export type UpdateStatus = "idle" | "checking" | "available" | "downloading" | "ready" | "error";

export function useAppUpdater() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [updateInfo, setUpdateInfo] = useState<Update | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const updateRef = useRef<Update | null>(null);

  const checkForUpdate = useCallback(async () => {
    if (!("__TAURI_INTERNALS__" in window)) return;
    try {
      setStatus("checking");
      setError(null);
      const update = await check();
      if (update) {
        updateRef.current = update;
        setUpdateInfo(update);
        setStatus("available");
      } else {
        setStatus("idle");
      }
    } catch (err) {
      console.error("[Updater] Check error:", err);
      setError("No se pudo comprobar la actualización.");
      setStatus("error");
    }
  }, []);

  const startInstall = useCallback(async () => {
    const update = updateRef.current;
    if (!update) return;

    try {
      setStatus("downloading");
      setProgress(0);
      let downloaded = 0;
      let totalLength = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            totalLength = event.data.contentLength ?? 0;
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            if (totalLength > 0) {
              setProgress(Math.min(100, Math.round((downloaded / totalLength) * 100)));
            }
            break;
          case "Finished":
            setProgress(100);
            setStatus("ready");
            break;
        }
      });

      await relaunch();
    } catch (err) {
      console.error("[Updater] Download/Install error:", err);
      setError("Error al descargar e instalar la actualización.");
      setStatus("error");
    }
  }, []);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  useEffect(() => {
    // Check when user mounts the layout
    void checkForUpdate();
  }, [checkForUpdate]);

  return {
    status,
    updateInfo,
    progress,
    error,
    isDismissed,
    checkForUpdate,
    startInstall,
    dismiss,
  };
}
