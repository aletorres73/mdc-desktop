import type { BillingModel } from "@/domain/entities/billing";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { formatMoney } from "@/lib/utils";

interface InvoiceArticlesProps {
  invoice: BillingModel;
}

export function InvoiceArticles({ invoice }: InvoiceArticlesProps) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Artículos</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descripción</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.articles.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Sin artículos cargados
                </TableCell>
              </TableRow>
            )}
            {invoice.articles.map((article, index) => {
              const quantity = article.pairs || 0;
              const subtotal = article.value * quantity;
              return (
                <TableRow key={`${article.name}-${index}`}>
                  <TableCell className="font-medium">{article.name || "-"}</TableCell>
                  <TableCell>{article.color || "-"}</TableCell>
                  <TableCell className="tabular-nums">{quantity}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(article.value)}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(subtotal)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
