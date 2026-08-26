import { db } from "./config";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  getDocs,
  DocumentData,
  QueryConstraint,
  WhereFilterOp,
  UpdateData,
} from "firebase/firestore";

function normalizeFirestoreValue(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (Array.isArray(value)) return value.map(normalizeFirestoreValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        normalizeFirestoreValue(nestedValue),
      ])
    );
  }
  return value;
}

function normalizeDocument<T>(id: string, data: DocumentData): T {
  const normalizedData = normalizeFirestoreValue(data);
  return {
    ...(normalizedData as Record<string, unknown>),
    id,
  } as T;
}

// ─── CRUD Operations ───

/**
 * Get a single document by path
 */
export async function getDocument<T = DocumentData>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return normalizeDocument<T>(docSnap.id, docSnap.data());
}

/**
 * Set (create/overwrite) a document
 */
export async function setDocument(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await setDoc(docRef, data);
}

/**
 * Update specific fields of a document
 */
export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, data as UpdateData<DocumentData>);
}

/**
 * Delete a document
 */
export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
}

/**
 * Add a document with auto-generated ID
 */
export async function addDocument(
  collectionName: string,
  data: Record<string, unknown>
): Promise<string> {
  const colRef = collection(db, collectionName);
  const docRef = await addDoc(colRef, data);
  return docRef.id;
}

/**
 * Query a collection with optional filters, ordering, and limits
 * 
 * Note: `collectionName` should be the collection path (e.g., "users/{uid}/factories")
 * For subcollections, pass the full path.
 */
export async function getCollection<T = DocumentData>(
  collectionName: string,
  options?: {
    filters?: Array<{ field: string; op: "=" | "==" | "<" | "<=" | ">" | ">=" | "array-contains" | "in"; value: unknown }>;
    orderBy?: { field: string; direction?: "asc" | "desc" };
    limit?: number;
    startAfter?: unknown;
  }
): Promise<T[]> {
  const colRef = collection(db, collectionName);
  const constraints: QueryConstraint[] = [];

  if (options?.filters && options.filters.length > 0) {
    for (const filter of options.filters) {
      const operator = filter.op === "=" ? "==" : filter.op;
      constraints.push(where(filter.field, operator as WhereFilterOp, filter.value));
    }
  }

  if (options?.orderBy) {
    constraints.push(orderBy(options.orderBy.field, options.orderBy.direction || "asc"));
  }

  if (options?.limit) {
    constraints.push(limit(options.limit));
  }

  if (options?.startAfter !== undefined && options.startAfter !== null) {
    constraints.push(startAfter(options.startAfter));
  }

  const q = query(colRef, ...constraints);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((docSnap) =>
    normalizeDocument<T>(docSnap.id, docSnap.data())
  );
}
