import { BadgePercent } from "lucide-react";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { formatMoney } from "@/lib/utils";

interface SuggestedDiscountCardProps {
  amount: number;
  paymentCondition: string;
  loading: boolean;
  onApply: () => void;
}

/**
 * Sugerencia de descuento (paridad con DetailInvoiceScreen.kt).
 * Se muestra cuando la factura tiene descuento esperado y aún no hay
 * movimiento de pronto pago registrado.
 */
export function SuggestedDiscountCard({
  amount,
  paymentCondition,
  loading,
  onApply,
}: SuggestedDiscountCardProps) {
  return (
    <Card className="border-emerald-200/60 bg-emerald-50/50 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
            <BadgePercent className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Descuento sugerido</p>
            <p className="text-sm text-muted-foreground">
              Se sugiere aplicar un pronto pago de {formatMoney(amount)}
              {paymentCondition ? ` según condición: ${paymentCondition}` : ""}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={onApply} loading={loading}>
          {loading ? "Aplicando..." : "Aplicar"}
        </Button>
      </CardContent>
    </Card>
  );
}
