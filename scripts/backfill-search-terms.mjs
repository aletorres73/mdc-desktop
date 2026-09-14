import {existsSync, readFileSync} from "node:fs";
import {createInterface} from "node:readline/promises";
import {stdin as input, stdout as output} from "node:process";
import {initializeApp} from "firebase/app";
import {getAuth, signInWithEmailAndPassword, signOut} from "firebase/auth";
import {getFunctions, httpsCallable} from "firebase/functions";

function loadDotEnv() {
  for (const fileName of [".env.local", ".env"]) {
    if (!existsSync(fileName)) continue;

    const content = readFileSync(fileName, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && process.env[match[1]] === undefined) {
        process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
      }
    }
  }
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable ${name}.`);
  return value;
}

function askHidden(question) {
  return new Promise((resolve) => {
    output.write(question);
    input.setRawMode?.(true);
    let password = "";
    const onData = (chunk) => {
      const key = chunk.toString();
      if (key === "\u0003") {
        input.setRawMode?.(false);
        input.pause();
        output.write("\n");
        process.exit(130);
      }
      if (key === "\r" || key === "\n") {
        input.setRawMode?.(false);
        input.pause();
        input.removeListener("data", onData);
        output.write("\n");
        resolve(password);
        return;
      }
      if (key === "\u007f") {
        password = password.slice(0, -1);
        return;
      }
      password += key;
    };
    input.resume();
    input.on("data", onData);
  });
}

async function main() {
  loadDotEnv();

  const emailReader = createInterface({input, output});
  const email = (await emailReader.question("Correo administrador: ")).trim();
  emailReader.close();
  const password = await askHidden("Contraseña: ");

  const app = initializeApp({
    apiKey: required("VITE_FIREBASE_API_KEY"),
    authDomain: required("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: required("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  });
  const auth = getAuth(app);

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await credential.user.getIdTokenResult(true);

    const functions = getFunctions(app);
    const backfill = httpsCallable(functions, "backfillSearchTerms");
    const response = await backfill({});
    console.log("Backfill completado:");
    console.dir(response.data, {depth: null});
  } finally {
    await signOut(auth);
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message ?? error}`);
  process.exitCode = 1;
});