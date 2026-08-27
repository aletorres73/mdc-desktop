import type { BillingModel } from "../entities/invoice";
import type { BuyOrderModel } from "../entities/order";
import { toFormattedDate, toPrint } from "../entities/formatters";

export class ReportGenerator {
  static generateOrderReport(order: BuyOrderModel): string {
    const lines: string[] = [];
    lines.push("📝 *NOTA DE PEDIDO*");
    lines.push("----------------------------");
    lines.push(`🆔 *Orden:* #${order.order}`);
    lines.push(`👤 *Cliente:* ${order.client}`);
    lines.push(`🏭 *Fábrica:* ${order.factory} (${order.branch})`);
    lines.push(`📅 *Fecha de Entrega:* ${toFormattedDate(order.deliveryDate)}`);
    lines.push("\n📦 *Detalle del Pedido:*");

    (order.articles || []).forEach((article) => {
      lines.push(`• ${article.name} (${article.color}): ${article.pairs} pares`);
    });

    if (order.comments) {
      lines.push(`\n💬 *Comentarios:* ${order.comments}`);
    }

    lines.push("----------------------------");
    lines.push("Generado por MDCapp");
    return lines.join("\n");
  }

  static generateInvoiceReport(billing: BillingModel): string {
    const lines: string[] = [];
    lines.push("📄 *INFORMACIÓN DE FACTURA*");
    lines.push("----------------------------");
    lines.push(`🔢 *Número:* ${billing.billingNumber}`);
    lines.push(`👤 *Cliente:* ${billing.clientName}`);
    lines.push(`🏷️ *Marca:* ${billing.brand}`);
    lines.push(`💰 *Monto Total:* ${toPrint(billing.total)}`);
    lines.push(`📅 *Vencimiento:* ${toFormattedDate(billing.payDate)}`);
    lines.push(`📌 *Estado:* ${billing.stateBilling}`);

    if (billing.rest > 0) {
      lines.push(`⚠️ *Saldo Pendiente:* ${toPrint(billing.rest)}`);
    } else {
      lines.push("✅ *Estado:* Totalmente Cobrada");
    }

    lines.push("----------------------------");
    lines.push("Generado por MDCapp");
    return lines.join("\n");
  }

  static generateCurrentAccountReport(clientName: string, billings: BillingModel[]): string {
    const pendingBillings = billings.filter((b) => b.rest > 0);
    const totalDebt = pendingBillings.reduce((sum, b) => sum + b.rest, 0);
    const expiredDebt = pendingBillings
      .filter((b) => b.stateBilling === "Vencido")
      .reduce((sum, b) => sum + b.rest, 0);

    const lines: string[] = [];
    lines.push("📊 *ESTADO DE CUENTA*");
    lines.push("----------------------------");
    lines.push(`👤 *Cliente:* ${clientName}`);
    lines.push(`📅 *Fecha:* ${toFormattedDate(Date.now())}\n`);

    lines.push(`💰 *Saldo Total:* ${toPrint(totalDebt)}`);
    if (expiredDebt > 0) {
      lines.push(`🔴 *Saldo Vencido:* ${toPrint(expiredDebt)}`);
    }

    lines.push("\n📑 *Documentos Pendientes:*");
    if (pendingBillings.length === 0) {
      lines.push("✅ No se registran facturas pendientes.");
    } else {
      pendingBillings.forEach((billing) => {
        const emoji = billing.stateBilling === "Vencido" ? "🔴" : "🟡";
        lines.push(
          `${emoji} *Fact:* ${billing.billingNumber} - *Vence:* ${toFormattedDate(billing.payDate)} - *Saldo:* ${toPrint(billing.rest)}`
        );
      });
    }

    lines.push("----------------------------");
    lines.push("Generado por MDCapp");
    return lines.join("\n");
  }
}
