import type { BillingModel } from "@/domain/entities/billing";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { formatMoney } from "@/lib/utils";

interface InvoiceTotalsProps {
  invoice: BillingModel;
}

/**
 * Montos alineados con TotalsCard de DetailInvoiceScreen.kt (app móvil).
 * Solo muestra: Total, Descuento sugerido, A cobrar, Pagado, Saldo.
 * Descuento sugerido (monto) = total * expectedDiscount/100 (expectedDiscount es porcentaje).
 */
export function InvoiceTotals({ invoice }: InvoiceTotalsProps) {
  const discountAmount = invoice.total * (invoice.expectedDiscount / 100);

  const rows: { label: string; value: number; strong?: boolean; accent?: boolean }[] = [
    { label: "Total", value: invoice.total },
    { label: "Descuento sugerido", value: discountAmount, accent: invoice.expectedDiscount > 0 },
    { label: "A cobrar", value: invoice.toPay },
    { label: "Pagado", value: invoice.payed },
    { label: "Saldo", value: invoice.rest, strong: true },
  ];

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Montos
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col">
          {rows.map((row) => (
            <div
              key={row.label}
              className={
                row.strong
                  ? "mt-1 flex items-center justify-between border-t border-border/50 pt-3"
                  : "flex items-center justify-between py-2"
              }
            >
              <span className={row.strong ? "text-sm font-semibold" : "text-sm text-muted-foreground"}>
                {row.label}
                {row.label === "Descuento sugerido" && invoice.expectedDiscount > 0 && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({invoice.expectedDiscount}%)
                  </span>
                )}
              </span>
              <span
                className={
                  row.strong
                    ? "text-base font-semibold tabular-nums"
                    : row.accent
                      ? "text-sm font-medium tabular-nums text-emerald-700"
                      : "text-sm font-medium tabular-nums"
                }
              >
                {formatMoney(row.value)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
