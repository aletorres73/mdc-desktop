import type { BillingModel } from "@/domain/entities/billing";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { formatDate } from "@/lib/utils";

interface InvoiceDatesProps {
  invoice: BillingModel;
}

const DATES: { key: "loadDate" | "deliveryDate" | "payDate"; label: string }[] = [
  { key: "loadDate", label: "Emisión" },
  { key: "deliveryDate", label: "Recepción" },
  { key: "payDate", label: "Vencimiento" },
];

export function InvoiceDates({ invoice }: InvoiceDatesProps) {
  return (
    <Card className="flex-1 border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Fechas
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <div className="grid h-full grid-cols-3 items-center gap-4">
          {DATES.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-sm font-medium tabular-nums">{formatDate(invoice[key])}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
