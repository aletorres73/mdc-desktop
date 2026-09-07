import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { BillingModel } from "@/domain/entities/billing";
import { StateBadge } from "@/presentation/components/invoices/StateBadge";

interface InvoiceHeaderProps {
  invoice: BillingModel;
  backToPath: string;
  actions?: React.ReactNode;
}

export function InvoiceHeader({ invoice, backToPath, actions }: InvoiceHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <Link
          to={backToPath}
          className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Facturas
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Factura #{invoice.billingNumber}</h1>
        <p className="text-sm text-muted-foreground">{invoice.clientName} · {invoice.brand}</p>
        <div className="mt-2">
          <StateBadge state={invoice.stateBilling} />
        </div>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
