import {
  collection,
  collectionGroup,
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
  startAfter,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/data/datasources/config";

// Firestore rejects `undefined` values, including nested inside arrays/objects.
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => stripUndefined(v)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

export function colRef(path: string) {
  return collection(db, path);
}

export function docRef(path: string, id: string) {
  return doc(db, path, id);
}

export async function getDocument<T = DocumentData>(path: string, id: string): Promise<T | null> {
  const snap = await getDoc(docRef(path, id));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as object) } as T) : null;
}

export async function getCollection<T = DocumentData>(
  path: string,
  constraints: QueryConstraint[] = [],
): Promise<T[]> {
  const q = query(colRef(path), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, __path: d.ref.path, ...(d.data() as object) })) as T[];
}

export async function getCollectionGroup<T = DocumentData>(
  collectionId: string,
  constraints: QueryConstraint[] = [],
): Promise<T[]> {
  const q = query(collectionGroup(db, collectionId), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, __path: d.ref.path, ...(d.data() as object) })) as T[];
}

export async function setDocument(path: string, id: string, data: unknown): Promise<void> {
  await setDoc(docRef(path, id), stripUndefined(data) as DocumentData, { merge: true });
}

export async function addDocument(path: string, data: unknown): Promise<string> {
  const ref = await addDoc(colRef(path), stripUndefined(data) as DocumentData);
  return ref.id;
}

export async function updateDocument(path: string, id: string, data: unknown): Promise<void> {
  await updateDoc(docRef(path, id), stripUndefined(data) as DocumentData);
}

export async function deleteDocument(path: string, id: string): Promise<void> {
  await deleteDoc(docRef(path, id));
}

export { where, orderBy, limit, startAfter };
export type { QueryDocumentSnapshot };
