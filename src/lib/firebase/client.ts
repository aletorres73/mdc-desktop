import { app, db } from "./config";
import { 
  getAuth, 
  setPersistence, 
  indexedDBLocalPersistence,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { 
  enableIndexedDbPersistence,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  DocumentData,
  QueryConstraint,
  UpdateData,
} from "firebase/firestore";

// Auth with persistence
export const auth = getAuth(app);
setPersistence(auth, indexedDBLocalPersistence).catch(console.error);

// Firestore with offline persistence
enableIndexedDbPersistence(db).catch(console.error);

// ─── Auth helpers ───

export async function signIn(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signUp(email: string, password: string, displayName?: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  return result.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export async function updateUserPassword(newPassword: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");
  await updatePassword(user, newPassword);
}

export async function reauthenticate(password: string) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("No user logged in");
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
}

export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ─── Firestore helpers ───

function userPath(uid: string, ...paths: string[]) {
  return `users/${uid}/${paths.join("/")}`;
}

export async function getDocument<T = DocumentData>(uid: string, path: string) {
  const ref = doc(db, userPath(uid, path));
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
}

export async function setDocument(uid: string, path: string, data: Record<string, unknown>) {
  const ref = doc(db, userPath(uid, path));
  await setDoc(ref, data, { merge: true });
}

export async function updateDocument(uid: string, path: string, data: Record<string, unknown>) {
  const ref = doc(db, userPath(uid, path));
  await updateDoc(ref, data as UpdateData<DocumentData>);
}

export async function deleteDocument(uid: string, path: string) {
  const ref = doc(db, userPath(uid, path));
  await deleteDoc(ref);
}

export async function addDocument(uid: string, collectionPath: string, data: Record<string, unknown>) {
  const ref = collection(db, userPath(uid, collectionPath));
  const docRef = await addDoc(ref, data);
  return docRef.id;
}

export async function getCollection<T = DocumentData>(
  uid: string, 
  collectionPath: string, 
  constraints: QueryConstraint[] = []
) {
  const ref = collection(db, userPath(uid, collectionPath));
  const q = query(ref, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
}

export function subscribeCollection<T = DocumentData>(
  uid: string,
  collectionPath: string,
  callback: (data: T[]) => void,
  constraints: QueryConstraint[] = []
) {
  const ref = collection(db, userPath(uid, collectionPath));
  const q = query(ref, ...constraints);
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
    callback(data);
  });
}

// Export query helpers
export { where, orderBy, limit, query };