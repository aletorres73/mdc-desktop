import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { useClients } from "@/presentation/hooks/useClients";
import { useFactories } from "@/presentation/hooks/useFactories";
import { useCreateInvoice } from "@/presentation/hooks/useInvoices";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Select } from "@/presentation/components/ui/select";
import { invoiceDetailPath } from "@/presentation/routes/routes";

export default function CreateInvoice() {
  const navigate = useNavigate();
  const { appUser } = useAuth();
  const { data: clients } = useClients(appUser?.uid);
  const { data: factories } = useFactories(appUser?.uid);
  const createInvoice = useCreateInvoice(appUser?.uid);
  const [clientId, setClientId] = useState("");
  const [factoryName, setFactoryName] = useState("");
  const [branch, setBranch] = useState("");
  const [paymentCondition, setPaymentCondition] = useState("");
  const [billingNumber, setBillingNumber] = useState("");
  const [type, setType] = useState("Factura");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [total, setTotal] = useState("");
  const [error, setError] = useState("");

  const client = clients?.find((item) => item.clientId === clientId);
  const factory = factories?.find((item) => item.name === factoryName);
  const condition = factory?.paymentType.find((item) => item.paymentName === paymentCondition);
  const needsBranch = (factory?.branchList.length ?? 0) > 0;
  const clientOptions = (clients ?? []).map((item) => ({ value: item.clientId, label: `${item.clientName} (${item.clientId})` }));
  const factoryOptions = (factories ?? []).map((item) => ({ value: item.name, label: item.name }));
  const branchOptions = (factory?.branchList ?? []).map((item) => ({ value: item, label: item }));
  const conditionOptions = (factory?.paymentType ?? []).map((item) => ({ value: item.paymentName, label: item.paymentName }));
  const numericTotal = useMemo(() => parseFloat(total) || 0, [total]);
  const canSubmit = Boolean(client && factory && billingNumber.trim() && numericTotal > 0 && (!needsBranch || branch) && !createInvoice.isPending);

  useEffect(() => {
    setBranch("");
    setPaymentCondition("");
  }, [factoryName]);

  const handleSubmit = async () => {
    if (!client || !factory) return;
    setError("");
    try {
      const discount = condition?.discount ?? 0;
      const id = await createInvoice.mutateAsync({
        billingNumber: billingNumber.trim(),
        orderId: "",
        type,
        total: numericTotal,
        loadDate: Date.now(),
        deliveryDate: deliveryDate ? new Date(deliveryDate).getTime() : 0,
        payDate: 0,
        articles: [],
        paymentCondition,
        expectedDiscount: discount,
        toPay: numericTotal * (1 - discount / 100),
        payed: 0,
        rest: numericTotal,
        stateBilling: "Pendiente",
        clientId: client.clientId,
        brand: factory.name,
        branch,
        comments: [],
        clientName: client.clientName,
        timeStamp: Date.now(),
      });
      navigate(invoiceDetailPath(id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo guardar la factura.");
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nueva factura</h1>
        <p className="text-sm text-muted-foreground">Venta directa sin pedido asociado.</p>
      </div>
      <Card className="border-border/50 shadow-sm">
        <CardHeader><CardTitle className="text-base">Datos de facturación</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Cliente</Label><Select options={clientOptions} placeholder="Seleccionar cliente" value={clientId} onChange={(event) => setClientId(event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Número de factura</Label><Input value={billingNumber} onChange={(event) => setBillingNumber(event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Fábrica</Label><Select options={factoryOptions} placeholder="Seleccionar fábrica" value={factoryName} onChange={(event) => setFactoryName(event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Marca / segmento{needsBranch ? "" : " (opcional)"}</Label><Select options={branchOptions} placeholder="Seleccionar segmento" value={branch} onChange={(event) => setBranch(event.target.value)} disabled={!factory || !needsBranch} /></div>
          <div className="space-y-1.5"><Label>Condición de pago</Label><Select options={conditionOptions} placeholder="Sin condición" value={paymentCondition} onChange={(event) => setPaymentCondition(event.target.value)} disabled={!factory} /></div>
          <div className="space-y-1.5"><Label>Tipo de documento</Label><Select options={[{ value: "Factura", label: "Factura" }, { value: "Remito", label: "Remito" }]} value={type} onChange={(event) => setType(event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Fecha de recepción</Label><Input type="date" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Total</Label><Input type="number" min="0" step="0.01" value={total} onChange={(event) => setTotal(event.target.value)} /></div>
        </CardContent>
      </Card>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      <Button onClick={handleSubmit} disabled={!canSubmit} loading={createInvoice.isPending}>{createInvoice.isPending ? "Guardando..." : "Crear factura"}</Button>
    </div>
  );
}