import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";

interface PaymentConditionProps {
  value: string;
}

export function PaymentCondition({ value }: PaymentConditionProps) {
  return (
    <Card className="flex flex-1 flex-col border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Condición de pago
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 items-center pt-0">
        <p className="text-base font-semibold">{value || "Sin condición"}</p>
      </CardContent>
    </Card>
  );
}
