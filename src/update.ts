import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export async function checkForUpdates() {
  if (!("__TAURI_INTERNALS__" in window)) return;

  try {
    const update = await check();
    if (!update) return;

    const shouldInstall = window.confirm(
      `Hay una nueva versión (${update.version}) disponible. ¿Descargarla e instalarla ahora?`,
    );
    if (!shouldInstall) return;

    await update.downloadAndInstall();
    await relaunch();
  } catch (error) {
    console.error("No se pudo comprobar la actualización", error);
  }
}