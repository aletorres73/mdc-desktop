import {generateSearchTerms} from "./searchTerms";
import type {QueryDocumentSnapshot} from "firebase-admin/firestore";

export type DocumentData = Record<string, unknown>;
export type SearchDocument = QueryDocumentSnapshot<DocumentData>;


const stringFields = {
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

export function arraysEqual(left: unknown, right: string[]): boolean {
    return Array.isArray(left) && left.length === right.length && left.every((term, index) => term === right[index]);
}


