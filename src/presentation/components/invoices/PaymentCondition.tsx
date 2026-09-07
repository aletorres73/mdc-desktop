import { useEffect, useState } from "react";
import type { PaymentCondition as FactoryPaymentCondition } from "@/domain/entities/factory";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/presentation/components/ui/dialog";
import { Button } from "@/presentation/components/ui/button";
import { Select } from "@/presentation/components/ui/select";

interface PaymentConditionProps {
  value: string;
  options: FactoryPaymentCondition[];
  loading: boolean;
  onChange: (nextPaymentName: string) => Promise<void>;
}

export function PaymentCondition({ value, options, loading, onChange }: PaymentConditionProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(value);

  useEffect(() => {
    setSelected(value);
  }, [value]);

  const handleConfirm = async () => {
    if (!selected || selected === value) {
      setOpen(false);
      return;
    }
    await onChange(selected);
    setOpen(false);
  };

  return (
    <Card className="flex flex-1 flex-col border-border/50 shadow-sm">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Condición de pago
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" variant="outline">Cambiar</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cambiar condición de pago</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Seleccioná una condición disponible para la fábrica.
              </p>
              <Select
                value={selected}
                onChange={(event) => setSelected(event.target.value)}
                options={options.map((option) => ({
                  value: option.paymentName,
                  label: `${option.paymentName} · ${option.expiration} días${option.discount > 0 ? ` · ${option.discount}% dto.` : ""}`,
                }))}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleConfirm} loading={loading}>
                {loading ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex flex-1 items-center pt-0">
        <p className="text-base font-semibold">{value || "Sin condición"}</p>
      </CardContent>
    </Card>
  );
}
