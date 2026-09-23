import * as admin from "firebase-admin";
import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { setGlobalOptions, logger } from "firebase-functions";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { audit, termsFor, arraysEqual, type SearchDocument } from "./utils";
import { onObjectFinalized } from "firebase-functions/v2/storage";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { defineSecret } from "firebase-functions/params";

if (getApps().length === 0) initializeApp();

export const db = getFirestore();

const BATCH_SIZE = 400;

async function commitBatch(
	writes: Array<{ snapshot: SearchDocument; collection: "client" | "billing" | "buyOrder" }>,
): Promise<number> {
	if (writes.length === 0) return 0;
	const batch = db.batch();
	for (const { snapshot, collection } of writes) {
		const data = snapshot.data();
		const patch = audit(data, collection);
		patch.searchTerms = termsFor({ ...data, ...patch }, snapshot.id, collection);
		batch.set(snapshot.ref, patch, { merge: true });
	}
	try {
		await batch.commit();
		return writes.length;
	} catch (error) {
		logger.error("Error al procesar un lote de backfill", error);
		return 0;
	}
}

export async function processSnapshots(snapshots: SearchDocument[], collection: "client" | "billing" | "buyOrder"): Promise<number> {
	let processed = 0;
	for (let index = 0; index < snapshots.length; index += BATCH_SIZE) {
		processed += await commitBatch(snapshots.slice(index, index + BATCH_SIZE).map((snapshot) => ({ snapshot, collection })));
	}
	return processed;
}


async function maintainDocument(snapshot: SearchDocument, collection: "client" | "billing" | "buyOrder"): Promise<void> {
	const data = snapshot.data();
	const patch = audit(data, collection);
	const searchTerms = termsFor({ ...data, ...patch }, snapshot.id, collection);
	if (!arraysEqual(data.searchTerms, searchTerms)) patch.searchTerms = searchTerms;
	if (Object.keys(patch).length > 0) await snapshot.ref.set(patch, { merge: true });
}

function getAfter(event: { data?: { after: { exists: boolean } } }): SearchDocument | null {
	const after = event.data?.after;
	return after?.exists ? after as SearchDocument : null;
}

export const maintainClients = onDocumentWritten("users/{uid}/clients/{clientId}", async (event) => {
	const after = getAfter(event);
	if (!after) return;
	await maintainDocument(after, "client");
});

export const maintainAllBillings = onDocumentWritten("users/{uid}/allBillings/{billingId}", async (event) => {
	const after = getAfter(event);
	if (!after) return;
	await maintainDocument(after, "billing");
});

export const maintainBuyOrders = onDocumentWritten("users/{uid}/clients/{clientId}/buyOrders/{orderId}", async (event) => {
	const after = getAfter(event);
	if (!after) return;
	await maintainDocument(after, "buyOrder");
});

export const backfillSearchTerms = onCall(async (request) => {
	const isAdmin = request.auth?.token.admin === true;
	if (!request.auth?.uid || !isAdmin) {
		throw new HttpsError("permission-denied", "Se requiere el claim de administrador.");
	}

	const users = await db.collection("users").get();
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
	return { processed, total: processed.clients + processed.allBillings + processed.buyOrders };
});

const geminiApiKey = defineSecret("GEMINI_API_KEY");

function parseGeminiJson(rawText: string): Record<string, any> {
	if (!rawText) return {};

	const sanitized = rawText
		.replace(/```json\s*/gi, "")
		.replace(/```\s*/g, "")
		.replace(/```/g, "")
		.trim();

	const start = sanitized.indexOf("{");
	const end = sanitized.lastIndexOf("}");
	const jsonText = start >= 0 && end > start ? sanitized.slice(start, end + 1) : sanitized;

	try {
		const parsed = JSON.parse(jsonText);
		return typeof parsed === "object" && parsed !== null ? parsed : {};
	} catch (error) {
		logger.warn(`No se pudo parsear la respuesta JSON de Gemini para la factura: ${sanitized}`);
		return {};
	}
}

export const onInvoiceUploaded = onObjectFinalized(
	{
		secrets: [geminiApiKey],
		memory: "512MiB",
		timeoutSeconds: 120,
	},
	async (event) => {
		const filePath = event.data.name;
		const contentType = event.data.contentType;

		if (!filePath || !filePath.startsWith("invoices/")) {
			console.log(`Skipping file outside 'invoices/': ${filePath}`);
			return;
		}

		const fileName = filePath.split("/").pop() || "";
		const documentId = fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");

		console.log(`Processing invoice document ${filePath} (documentId: ${documentId})`);

		const resultRef = db.collection("scan_results").doc(documentId);

		await resultRef.set(
			{
				status: "processing",
				filePath,
				updatedAt: FieldValue.serverTimestamp(),
			},
			{ merge: true }
		);

		try {
			const apiKey = await geminiApiKey.value();
			if (!apiKey) {
				throw new Error("Falta la variable de entorno GEMINI_API_KEY");
			}

			const bucket = admin.storage().bucket(event.data.bucket);
			const file = bucket.file(filePath);

			const [fileBuffer] = await file.download();
			const base64Data = fileBuffer.toString("base64");
			const mimeType =
				contentType || (filePath.endsWith(".pdf") ? "application/pdf" : "image/jpeg");

			const genAi = new GoogleGenerativeAI(apiKey);
			const model = genAi.getGenerativeModel({
				model: "gemini-3.5-flash-lite",
				systemInstruction: {
					text:
						"Eres un asistente contable de Argentina. Devuelve la salida SIEMPRE en formato JSON puro (sin markdown, sin bloques ```json).",
				},
			});

			const prompt = `Analiza este documento (factura o remito) y extrae la siguiente información en formato JSON con estas claves exactas:
							- "number": El número del documento (ej. 0001-00001234). String vacío si no se encuentra.
							- "total": El monto final a pagar. Solo el número sin signo de dólar. String vacío si no se encuentra.
							- "type": Debe ser "Factura" o "Remito". Si no dice, asume "Remito".
							- "date": La fecha de emisión o entrega en formato "yyyy-MM-dd".`;

			const result = await model.generateContent({
				contents: [
					{
						role: "user",
						parts: [
							{
								inlineData: {
									data: base64Data,
									mimeType,
								},
							},
							{
								text: prompt,
							},
						],
					},
				],
			});

			const response = await result.response;
			const responseText = (response.candidates ?? [])
				.flatMap((candidate) => candidate.content?.parts ?? [])
				.map((part) => part.text ?? "")
				.join("\n")
				.trim();

			console.log(`Gemini response for ${documentId}: ${responseText}`);

			const parsedJson = parseGeminiJson(responseText);
			const clientName = filePath.split("/").slice(1, -1).join("/") || "";

			const resultData = {
				status: "completed",
				number: typeof parsedJson.number === "string" ? parsedJson.number : "",
				total: typeof parsedJson.total === "string" ? parsedJson.total : "",
				type: parsedJson.type === "Factura" || parsedJson.type === "Remito" ? parsedJson.type : "Remito",
				date: typeof parsedJson.date === "string" ? parsedJson.date : "",
				clientName,
				error: null,
				createdAt: Date.now(),
			};

			await resultRef.set(resultData, { merge: true });

			console.log(`Successfully processed invoice documentId: ${documentId}`);
			console.log(`Result data for ${documentId}: ${JSON.stringify(resultData)}`);
			
		} catch (error: any) {
			console.error(`Error processing invoice ${documentId}:`, error);
			await resultRef.set(
				{
					status: "error",
					error: error.message || "Unknown error processing document",
					updatedAt: Date.now(),
				},
				{ merge: true }
			);
		}
	}
);


setGlobalOptions({ maxInstances: 10 });
