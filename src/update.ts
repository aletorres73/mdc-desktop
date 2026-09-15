import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export async function checkForUpdates() {
  if (!("__TAURI_INTERNALS__" in window)) return;

  try {
    console.log("[Updater] Buscando actualizaciones...");
    const update = await check();
    if (!update) {
      console.log("[Updater] La aplicación está al día.");
      return;
    }

    console.log(`[Updater] Actualización encontrada: versión ${update.version}`);

    const shouldInstall = window.confirm(
      `Hay una nueva versión (${update.version}) disponible. ¿Descargarla e instalarla ahora?`,
    );
    if (!shouldInstall) {
      console.log("[Updater] El usuario canceló la instalación.");
      return;
    }

    let downloaded = 0;
    let contentLength = 0;

    console.log("[Updater] Iniciando descarga e instalación...");
    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case "Started":
          contentLength = event.data.contentLength ?? 0;
          console.log(`[Updater] Descarga iniciada. Tamaño total: ${contentLength} bytes`);
          break;
        case "Progress":
          downloaded += event.data.chunkLength;
          if (contentLength > 0) {
            const percent = ((downloaded / contentLength) * 100).toFixed(2);
            console.log(`[Updater] Progreso: ${percent}% (${downloaded}/${contentLength} bytes)`);
          } else {
            console.log(`[Updater] Descargados: ${downloaded} bytes`);
          }
          break;
        case "Finished":
          console.log("[Updater] Descarga completada e instalador ejecutado.");
          break;
      }
    });

    console.log("[Updater] Reiniciando aplicación...");
    await relaunch();
  } catch (error) {
    console.error("[Updater] Error durante el proceso de actualización:", error);
  }
}