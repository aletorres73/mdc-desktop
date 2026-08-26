// Firebase REST API Configuration
// Matching the Desktop (jvmMain) REST-based Firebase setup

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC8RSmswZFBr4IhOgjtTyxH0GojOtu9F8k",
  projectId: "database-rw-60033",
  authDomain: "database-rw-60033.firebaseapp.com",
  storageBucket: "database-rw-60033.appspot.com",
} as const;

// API Endpoints
export const AUTH_ENDPOINT = `https://identitytoolkit.googleapis.com/v1/accounts`;
export const FIRESTORE_ENDPOINT = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;
export const STORAGE_ENDPOINT = `https://firestorage.googleapis.com/v0/b/${FIREBASE_CONFIG.storageBucket}/o`;
