import { FIRESTORE_ENDPOINT } from "./config";
import type {
  FirestoreDocument,
  FirestoreListResponse,
  FirestoreValue,
} from "./types";

// ─── Helper: wrap JS value → Firestore REST value ───
export function wrapValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (typeof value === "boolean") return { booleanValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value))
    return { arrayValue: { values: value.map(wrapValue) } };
  if (typeof value === "object")
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value as Record<string, unknown>).map(([k, v]) => [
            k,
            wrapValue(v),
          ])
        ),
      },
    };
  return { stringValue: String(value) };
}

// ─── Helper: unwrap Firestore REST value → JS value ───
export function unwrapValue(fv: FirestoreValue): unknown {
  if (fv.stringValue !== undefined) return fv.stringValue;
  if (fv.integerValue !== undefined) return Number(fv.integerValue);
  if (fv.doubleValue !== undefined) return fv.doubleValue;
  if (fv.booleanValue !== undefined) return fv.booleanValue;
  if (fv.nullValue !== undefined) return null;
  if (fv.timestampValue !== undefined) return new Date(fv.timestampValue);
  if (fv.arrayValue !== undefined)
    return fv.arrayValue.values.map(unwrapValue);
  if (fv.mapValue !== undefined)
    return Object.fromEntries(
      Object.entries(fv.mapValue.fields).map(([k, v]) => [k, unwrapValue(v)])
    );
  if (fv.referenceValue !== undefined) return fv.referenceValue;
  if (fv.geoPointValue !== undefined) return fv.geoPointValue;
  return null;
}

// ─── Flatten document to plain JS object ───
export function flattenDocument(doc: FirestoreDocument): Record<string, unknown> {
  const result: Record<string, unknown> = { _id: doc.name.split("/").pop() };
  for (const [key, value] of Object.entries(doc.fields)) {
    result[key] = unwrapValue(value);
  }
  return result;
}

// ─── Build a Firestore REST field filter ───
function buildFilter(
  field: string,
  op: "=" | "<" | "<=" | ">" | ">=" | "ARRAY_CONTAINS" | "IN",
  value: unknown
) {
  const opMap: Record<string, string> = {
    "=": "EQUAL",
    "<": "LESS_THAN",
    "<=": "LESS_THAN_OR_EQUAL",
    ">": "GREATER_THAN",
    ">=": "GREATER_THAN_OR_EQUAL",
    ARRAY_CONTAINS: "ARRAY_CONTAINS",
    IN: "IN",
  };
  return {
    fieldFilter: {
      field: { fieldPath: field },
      op: opMap[op],
      value: wrapValue(value),
    },
  };
}

// ─── Authentication header helper ───
function authHeaders(idToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${idToken}`,
    "Content-Type": "application/json",
  };
}

// ─── CRUD Operations ───

/**
 * Get a single document by path
 * Mirrors DesktopDatabaseRepository.getDocument()
 */
export async function getDocument<T = Record<string, unknown>>(
  collection: string,
  docId: string,
  idToken: string
): Promise<T | null> {
  const url = `${FIRESTORE_ENDPOINT}/${collection}/${docId}`;
  const response = await fetch(url, { headers: authHeaders(idToken) });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Error getting document: ${response.statusText}`);

  const doc: FirestoreDocument = await response.json();
  return flattenDocument(doc) as T;
}

/**
 * Set (create/overwrite) a document
 * Mirrors DesktopDatabaseRepository.setDocument()
 */
export async function setDocument(
  collection: string,
  docId: string,
  data: Record<string, unknown>,
  idToken: string
): Promise<void> {
  const url = `${FIRESTORE_ENDPOINT}/${collection}/${docId}`;
  const fields = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, wrapValue(v)])
  );

  const response = await fetch(url, {
    method: "PATCH",
    headers: authHeaders(idToken),
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) throw new Error(`Error setting document: ${response.statusText}`);
}

/**
 * Update specific fields of a document
 * Mirrors DesktopDatabaseRepository.updateDocument()
 */
export async function updateDocument(
  collection: string,
  docId: string,
  data: Record<string, unknown>,
  idToken: string
): Promise<void> {
  const url = `${FIRESTORE_ENDPOINT}/${collection}/${docId}`;
  const fields = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, wrapValue(v)])
  );

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      ...authHeaders(idToken),
      "X-HTTP-Method-Override": "PATCH",
    },
    body: JSON.stringify({
      fieldPaths: Object.keys(data),
      fields,
    }),
  });

  if (!response.ok) throw new Error(`Error updating document: ${response.statusText}`);
}

/**
 * Delete a document
 * Mirrors DesktopDatabaseRepository.deleteDocument()
 */
export async function deleteDocument(
  collection: string,
  docId: string,
  idToken: string
): Promise<void> {
  const url = `${FIRESTORE_ENDPOINT}/${collection}/${docId}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: authHeaders(idToken),
  });

  if (!response.ok) throw new Error(`Error deleting document: ${response.statusText}`);
}

/**
 * Add a document with auto-generated ID
 * Mirrors DesktopDatabaseRepository.addDocument()
 */
export async function addDocument(
  collection: string,
  data: Record<string, unknown>,
  idToken: string
): Promise<string> {
  const url = `${FIRESTORE_ENDPOINT}/${collection}`;
  const fields = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, wrapValue(v)])
  );

  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(idToken),
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) throw new Error(`Error adding document: ${response.statusText}`);

  const doc: FirestoreDocument = await response.json();
  return doc.name.split("/").pop()!;
}

/**
 * Query a collection with optional filters, ordering, and limits
 * Mirrors DesktopDatabaseRepository.getCollection()
 */
export async function getCollection<T = Record<string, unknown>>(
  collection: string,
  idToken: string,
  options?: {
    filters?: Array<{ field: string; op: "=" | "<" | "<=" | ">" | ">="; value: unknown }>;
    orderBy?: { field: string; direction?: "ASCENDING" | "DESCENDING" };
    limit?: number;
  }
): Promise<T[]> {
  const structuredQuery: Record<string, unknown> = {
    from: [{ collectionId: collection }],
  };

  if (options?.filters && options.filters.length > 0) {
    structuredQuery.where = options.filters.length === 1
      ? buildFilter(options.filters[0].field, options.filters[0].op, options.filters[0].value)
      : {
          compositeFilter: {
            op: "AND",
            filters: options.filters.map((f) =>
              buildFilter(f.field, f.op, f.value)
            ),
          },
        };
  }

  if (options?.orderBy) {
    structuredQuery.orderBy = [
      {
        field: { fieldPath: options.orderBy.field },
        direction: options.orderBy.direction || "ASCENDING",
      },
    ];
  }

  if (options?.limit) {
    structuredQuery.limit = options.limit;
  }

  const url = `${FIRESTORE_ENDPOINT}:runQuery`;
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(idToken),
    body: JSON.stringify({ structuredQuery }),
  });

  if (!response.ok) throw new Error(`Error querying collection: ${response.statusText}`);

  const data = await response.json();
  // Firestore runQuery returns an array of { document? } objects
  return (data as FirestoreListResponse[])
    .filter((item) => item.documents)
    .flatMap((item) =>
      (item.documents || []).map((doc) => flattenDocument(doc) as T)
    );
}
