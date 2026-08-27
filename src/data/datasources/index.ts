export { app, db, firebaseConfig } from "./config";
export * from "./types";
export { auth, signIn, signUp, signOut, updateUserPassword, reauthenticate, deleteCurrentUser, sendPasswordReset, onAuthStateChange } from "./client";
export * from "./firestore";
