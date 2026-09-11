import {getApps, initializeApp} from "firebase-admin/app";
import {getFirestore, QueryDocumentSnapshot} from "firebase-admin/firestore";
import {setGlobalOptions} from "firebase-functions";
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {generateSearchTerms} from "./searchTerms";

if (getApps().length === 0) initializeApp();

const db = getFirestore();
const BATCH_SIZE = 400;
const SEARCH_TERMS_TEST_UID = process.env.SEARCH_TERMS_TEST_UID?.trim();
type DocumentData = Record<string, unknown>;
type SearchDocument = QueryDocumentSnapshot<DocumentData>;

export const stringFields = {
	client: ["Cliente Id", "Razón Social"],
	billing: ["Numero", "Orden", "Tipo Facturacion", "Total", "A cobrar", "Pagado", "Saldo", "Condicion de pago", "Estado", "Cliente Id", "Marca", "Segmento", "Razon Social"],
	buyOrder: ["Pedido Id", "Orden Id", "Cliente Id", "Razón Social", "Fábrica", "Marca", "Tipo", "Facturación", "Comentarios", "Condición de Pago"],
} as const;

export const numberFields = {
	client: [],
	billing: ["Fecha", "Fecha recepción", "Fecha Pago", "Dto", "Timestamp"],
	buyOrder: ["Plazo de entrega", "Fecha de carga", "Descuento", "Días Vencimiento", "Timestamp"],
} as const;

function value(data: DocumentData, ...keys: string[]): unknown {
	return keys.map((key) => data[key]).find((candidate) => candidate !== null && candidate !== undefined);
}

export function audit(data: DocumentData, collection: "client" | "billing" | "buyOrder"): DocumentData {
	const patch: DocumentData = {};
	for (const key of stringFields[collection]) {
		if (data[key] === null || data[key] === undefined) patch[key] = "";
	}
	if (collection !== "client") {
		for (const key of numberFields[collection]) {
			if (data[key] === null || data[key] === undefined) patch[key] = 0;
		}
	}
	return patch;
}

export function termsFor(data: DocumentData, documentId: string, collection: "client" | "billing" | "buyOrder"): string[] {
	if (collection === "client") {
		return generateSearchTerms(
			String(value(data, "clientName", "Razón Social") ?? ""),
			String(value(data, "clientId", "Cliente Id") ?? documentId),
			documentId,
		);
	}
	if (collection === "billing") {
		return generateSearchTerms(
			String(value(data, "clientName", "Razon Social", "Razón Social") ?? ""),
			String(value(data, "billingNumber", "Numero") ?? ""),
			String(value(data, "orderId", "Orden") ?? ""),
			String(value(data, "id") ?? documentId),
		);
	}
	return generateSearchTerms(
		String(value(data, "client", "Razón Social") ?? ""),
		String(value(data, "order", "Orden Id") ?? ""),
		String(value(data, "factory", "Fábrica") ?? ""),
		String(value(data, "id", "Pedido Id") ?? documentId),
	);
}

function arraysEqual(left: unknown, right: string[]): boolean {
	return Array.isArray(left) && left.length === right.length && left.every((term, index) => term === right[index]);
}

async function maintainDocument(snapshot: SearchDocument, collection: "client" | "billing" | "buyOrder"): Promise<void> {
	const data = snapshot.data();
	const patch = audit(data, collection);
	const searchTerms = termsFor({...data, ...patch}, snapshot.id, collection);
	if (!arraysEqual(data.searchTerms, searchTerms)) patch.searchTerms = searchTerms;
	if (Object.keys(patch).length > 0) await snapshot.ref.set(patch, {merge: true});
}

function getAfter(event: {data?: {after: {exists: boolean}}}): SearchDocument | null {
	const after = event.data?.after;
	return after?.exists ? after as SearchDocument : null;
}

function isTestUser(event: {params: {uid?: string}}): boolean {
	return Boolean(SEARCH_TERMS_TEST_UID && event.params.uid === SEARCH_TERMS_TEST_UID);
}

export const maintainClients = onDocumentWritten("users/{uid}/clients/{clientId}", async (event) => {
	if (!isTestUser(event)) return;
	const after = getAfter(event);
	if (!after) return;
	await maintainDocument(after, "client");
});

export const maintainAllBillings = onDocumentWritten("users/{uid}/allBillings/{billingId}", async (event) => {
	if (!isTestUser(event)) return;
	const after = getAfter(event);
	if (!after) return;
	await maintainDocument(after, "billing");
});

export const maintainBuyOrders = onDocumentWritten("users/{uid}/clients/{clientId}/buyOrders/{orderId}", async (event) => {
	if (!isTestUser(event)) return;
	const after = getAfter(event);
	if (!after) return;
	await maintainDocument(after, "buyOrder");
});

async function commitBatch(
	writes: Array<{snapshot: SearchDocument; collection: "client" | "billing" | "buyOrder"}>,
): Promise<number> {
	if (writes.length === 0) return 0;
	const batch = db.batch();
	for (const {snapshot, collection} of writes) {
		const data = snapshot.data();
		const patch = audit(data, collection);
		patch.searchTerms = termsFor({...data, ...patch}, snapshot.id, collection);
		batch.set(snapshot.ref, patch, {merge: true});
	}
	try {
		await batch.commit();
		return writes.length;
	} catch (error) {
		logger.error("Error al procesar un lote de backfill", error);
		return 0;
	}
}

async function processSnapshots(snapshots: SearchDocument[], collection: "client" | "billing" | "buyOrder"): Promise<number> {
	let processed = 0;
	for (let index = 0; index < snapshots.length; index += BATCH_SIZE) {
		processed += await commitBatch(snapshots.slice(index, index + BATCH_SIZE).map((snapshot) => ({snapshot, collection})));
	}
	return processed;
}

export const backfillSearchTerms = onCall(async (request) => {
	const authUid = request.auth?.uid;
	const isConfiguredTestUser = authUid === SEARCH_TERMS_TEST_UID;
	const isAdmin = request.auth?.token.admin === true;
	const scope = request.data?.scope;
	if (!authUid || (!isAdmin && !(isConfiguredTestUser && scope === "currentUser"))) {
		throw new HttpsError("permission-denied", "Se requiere el claim de administrador.");
	}

	if (scope !== undefined && scope !== "all" && scope !== "currentUser") {
		throw new HttpsError("invalid-argument", "scope debe ser all o currentUser.");
	}

	const users = scope === "currentUser"
		? {docs: [await db.collection("users").doc(authUid).get()]}
		: await db.collection("users").get();
	const clients: SearchDocument[] = [];
	const billings: SearchDocument[] = [];
	const buyOrders: SearchDocument[] = [];

	for (const user of users.docs) {
		const clientSnapshots = await user.ref.collection("clients").get();
		const billingSnapshots = await user.ref.collection("allBillings").get();
		clients.push(...clientSnapshots.docs);
		billings.push(...billingSnapshots.docs);
		for (const client of clientSnapshots.docs) {
			const orderSnapshots = await client.ref.collection("buyOrders").get();
			buyOrders.push(...orderSnapshots.docs);
		}
	}

	const processed = {
		clients: await processSnapshots(clients, "client"),
		allBillings: await processSnapshots(billings, "billing"),
		buyOrders: await processSnapshots(buyOrders, "buyOrder"),
	};
	return {processed, total: processed.clients + processed.allBillings + processed.buyOrders};
});

setGlobalOptions({ maxInstances: 10 });
