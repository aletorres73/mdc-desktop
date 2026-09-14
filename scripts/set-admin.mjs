import {createInterface} from "node:readline/promises";
import {stdin as input, stdout as output} from "node:process";
import {getApps, initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";

async function main() {
  if (getApps().length === 0) initializeApp();

  const reader = createInterface({input, output});
  const email = (await reader.question("Correo del usuario: ")).trim();
  reader.close();

  if (!email) throw new Error("Debes indicar un correo.");

  const auth = getAuth();
  const user = await auth.getUserByEmail(email);
  const enabled = !process.argv.includes("--remove");

  await auth.setCustomUserClaims(user.uid, {
    ...(user.customClaims ?? {}),
    admin: enabled,
  });

  const updatedUser = await auth.getUser(user.uid);
  console.log(`admin=${enabled} asignado a ${updatedUser.email ?? updatedUser.uid}`);
  console.log("Claims actuales:", updatedUser.customClaims ?? {});
}

main().catch((error) => {
  console.error(`Error: ${error.message ?? error}`);
  process.exitCode = 1;
});