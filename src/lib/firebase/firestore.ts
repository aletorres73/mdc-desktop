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
  getDocs,
  DocumentData,
  QueryConstraint,
  WhereFilterOp,
  UpdateData,
} from "firebase/firestore";

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
  return { id: docSnap.id, ...docSnap.data() } as T;
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
    filters?: Array<{ field: string; op: "=" | "<" | "<=" | ">" | ">=" | "array-contains" | "in"; value: unknown }>;
    orderBy?: { field: string; direction?: "asc" | "desc" };
    limit?: number;
  }
): Promise<T[]> {
  const colRef = collection(db, collectionName);
  const constraints: QueryConstraint[] = [];

  if (options?.filters && options.filters.length > 0) {
    for (const filter of options.filters) {
      constraints.push(where(filter.field, filter.op as WhereFilterOp, filter.value));
    }
  }

  if (options?.orderBy) {
    constraints.push(orderBy(options.orderBy.field, options.orderBy.direction || "asc"));
  }

  if (options?.limit) {
    constraints.push(limit(options.limit));
  }

  const q = query(colRef, ...constraints);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as T[];
}
