import {describe, expect, it} from "vitest";
import {audit, numberFields, stringFields, termsFor} from "../../functions/src/index";
import {generateSearchTerms} from "../../functions/src/searchTerms";

const collections = ["client", "billing", "buyOrder"] as const;

function logResult(label: string, value: unknown): void {
	console.log(`[searchTerms] ${label}`, JSON.stringify(value, null, 2));
}

describe("generateSearchTerms", () => {
	it("normaliza tildes, mayusculas, signos, espacios, prefijos y combinaciones", () => {
		const terms = generateSearchTerms("  Razón Social: Cliente Ñandú  ", "123-456", "");
		logResult("normalizacion y combinaciones", terms);

		expect(terms).toEqual([...new Set(terms)].sort());
		expect(terms).toEqual(expect.arrayContaining([
			"r",
			"razon",
			"razonsocial",
			"cliente",
			"clientenandu",
			"123456",
		]));
		expect(terms).not.toContain("");
		expect(terms).not.toContain("razón");
	});

	it("ignora strings vacios y valores repetidos", () => {
		const terms = generateSearchTerms("", "   ", "A", "a");
		logResult("strings vacios y duplicados", terms);

		expect(terms).toEqual(["a"]);
	});
});

describe("audit", () => {
	it.each(collections)("no modifica campos completos de %s", (collection) => {
		const data: Record<string, unknown> = {};
		for (const field of stringFields[collection]) data[field] = `texto-${field}`;
		for (const field of numberFields[collection]) data[field] = 123;
		logResult(`audit ${collection} completo`, {input: data, output: audit(data, collection)});

		expect(audit(data, collection)).toEqual({});
	});

	it.each(collections)("rellena todos los strings ausentes de %s", (collection) => {
		const result = audit({}, collection);
		logResult(`audit ${collection} strings ausentes`, result);

		for (const field of stringFields[collection]) expect(result[field]).toBe("");
	});

	it.each(collections)("rellena null y undefined en strings de %s", (collection) => {
		const data: Record<string, unknown> = {};
		for (const [index, field] of stringFields[collection].entries()) {
			data[field] = index % 2 === 0 ? null : undefined;
		}

		const result = audit(data, collection);
		logResult(`audit ${collection} null y undefined`, {input: data, output: result});
		for (const field of stringFields[collection]) expect(result[field]).toBe("");
	});

	it.each(["billing", "buyOrder"] as const)("rellena todos los numeros ausentes de %s", (collection) => {
		const result = audit({}, collection);
		logResult(`audit ${collection} numeros ausentes`, result);

		for (const field of numberFields[collection]) expect(result[field]).toBe(0);
	});

	it("no agrega campos numericos a clientes", () => {
		const result = audit({}, "client");
		logResult("audit client sin campos numericos", result);

		expect(result).toEqual({
			"Cliente Id": "",
			"Razón Social": "",
		});
	});

	it("conserva tipos y valores existentes aunque sean cero o string vacio", () => {
		const data: Record<string, unknown> = {};
		for (const field of stringFields.billing) data[field] = `texto-${field}`;
		for (const field of numberFields.billing) data[field] = 123;
		data["Cliente Id"] = "";
		data["Razón Social"] = "";
		data.Total = "6000.0";
		data.Dto = 0;
		data.Timestamp = 0;
		logResult("audit billing conserva valores", {input: data, output: audit(data, "billing")});

		expect(audit(data, "billing")).toEqual({});
	});
});

describe("termsFor por coleccion", () => {
	it("incluye los campos buscables de clientes", () => {
		const terms = termsFor({"Cliente Id": "1", "Razón Social": "Cliente Ñandú"}, "client-doc", "client");
		logResult("termsFor client", terms);

		expect(terms).toEqual(expect.arrayContaining(["1", "cliente", "clientenandu", "clientdoc"]));
	});

	it("incluye numero, cliente, orden e id de facturas", () => {
		const terms = termsFor({
			"Razon Social": "Cliente 1",
			Numero: "123456",
			Orden: "ORD-78",
		}, "billing-doc", "billing");
		logResult("termsFor billing", terms);

		expect(terms).toEqual(expect.arrayContaining(["cliente", "cliente1", "123456", "ord78", "billingdoc"]));
	});

	it("incluye cliente, orden, fabrica e id de pedidos", () => {
		const terms = termsFor({
			"Razón Social": "Cliente Ñandú",
			"Orden Id": "ORD-78",
			Fábrica: "Fábrica Sur",
			"Pedido Id": "PED-9",
		}, "order-doc", "buyOrder");
		logResult("termsFor buyOrder", terms);

		expect(terms).toEqual(expect.arrayContaining(["cliente", "ord78", "fabricasur", "ped9"]));
	});

	it("usa el ID del documento cuando faltan los campos buscables", () => {
		for (const collection of collections) {
			const terms = termsFor({}, "fallback-123", collection);
			logResult(`termsFor ${collection} fallback`, terms);
			expect(terms).toContain("fallback123");
		}
	});
});