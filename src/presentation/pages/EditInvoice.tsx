import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { useClients } from "@/presentation/hooks/useClients";
import { useFactories } from "@/presentation/hooks/useFactories";
import { useInvoice, useUpdateInvoice } from "@/presentation/hooks/useInvoices";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Select } from "@/presentation/components/ui/select";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { DateInput } from "@/presentation/components/shared/DateInput";
import { invoiceDetailPath } from "@/presentation/routes/routes";
import { ArrowLeft, Save } from "lucide-react";

export default function EditInvoice() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { appUser } = useAuth();
  const { data: invoice, isLoading } = useInvoice(appUser?.uid, invoiceId);
  const { data: clients } = useClients(appUser?.uid);
  const { data: factories } = useFactories(appUser?.uid);
  const updateInvoice = useUpdateInvoice(appUser?.uid, invoiceId!);
  const [clientId, setClientId] = useState("");
  const [factoryName, setFactoryName] = useState("");
  const [branch, setBranch] = useState("");
  const [paymentCondition, setPaymentCondition] = useState("");
  const [billingNumber, setBillingNumber] = useState("");
  const [type, setType] = useState("Factura");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [total, setTotal] = useState("");
  const [error, setError] = useState("");

  const backToSearch = typeof location.state?.backToSearch === "string"
    ? location.state.backToSearch
    : "";
  const backToPath = typeof location.state?.backToPath === "string"
    ? location.state.backToPath
    : invoiceDetailPath(invoiceId ?? "");

  useEffect(() => {
    if (!invoice) return;
    setClientId(invoice.clientId);
    setFactoryName(invoice.brand);
    setBranch(invoice.branch);
    setPaymentCondition(invoice.paymentCondition);
    setBillingNumber(invoice.billingNumber);
    setType(invoice.type);
    setDeliveryDate(invoice.deliveryDate ? new Date(invoice.deliveryDate).toISOString().slice(0, 10) : "");
    setTotal(String(invoice.total));
  }, [invoice]);

  const client = clients?.find((item) => item.clientId === clientId);
  const factory = factories?.find((item) => item.name === factoryName);
  const condition = factory?.paymentType.find((item) => item.paymentName === paymentCondition);
  const isOrderInvoice = invoice?.orderId.trim().length > 0;
  const needsBranch = (factory?.branchList.length ?? 0) > 0;
  const selectedBranch = branch || (isOrderInvoice ? factory?.branchList[0] ?? "" : "");
  const clientOptions = (clients ?? []).map((item) => ({ value: item.clientId, label: `${item.clientName} (${item.clientId})` }));
  const factoryOptions = (factories ?? []).map((item) => ({ value: item.name, label: item.name }));
  const branchOptions = (factory?.branchList ?? []).map((item) => ({ value: item, label: item }));
  const conditionOptions = (factory?.paymentType ?? []).map((item) => ({ value: item.paymentName, label: item.paymentName }));
  const numericTotal = parseFloat(total) || 0;
  const hasValidTotal = numericTotal > 0;
  const missing: string[] = [];
  if (!client) missing.push("cliente");
  if (!factory) missing.push("fábrica");
  if (!billingNumber.trim()) missing.push("número de factura");
  if (needsBranch && !selectedBranch) missing.push("marca o segmento");
  if (!hasValidTotal) missing.push("total mayor a 0");
  const canSave = missing.length === 0 && !updateInvoice.isPending;

  if (isLoading) return <LoadingState className="min-h-[60vh]" />;
  if (!invoice || !invoiceId) return <p className="text-muted-foreground">Factura no encontrada.</p>;

  const handleSave = async () => {
    if (!client || !factory || !billingNumber.trim() || !hasValidTotal || (needsBranch && !selectedBranch)) return;
    setError("");
    try {
      const discount = condition?.discount ?? 0;
      await updateInvoice.mutateAsync({
        billingNumber: billingNumber.trim(), clientId: client.clientId, clientName: client.clientName,
        brand: factory.name, branch: selectedBranch, paymentCondition, type, total: numericTotal,
        deliveryDate: deliveryDate ? new Date(deliveryDate).getTime() : 0,
        expectedDiscount: discount, toPay: numericTotal * (1 - discount / 100),
      });
      navigate(invoiceDetailPath(invoiceId), { state: { backToSearch, backToPath } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo actualizar la factura.");
    }
  };

  return (
    <div className="flex w-full max-w-[1600px] flex-col gap-6 px-2 py-2 sm:px-3 lg:px-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <Link to={invoiceDetailPath(invoiceId)} state={{ backToSearch, backToPath }} className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Factura
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Editar factura</h1>
          <p className="text-sm text-muted-foreground">Cliente: {client?.clientName ?? invoice.clientName}</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
          {factoryName ? `Fábrica: ${factoryName}` : "Sin fábrica seleccionada"}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2.5fr)_320px]">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Datos de facturación</CardTitle>
            <p className="text-sm text-muted-foreground">Completá los datos necesarios para actualizar la factura.</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Select options={clientOptions} value={clientId} onChange={(event) => setClientId(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Número de factura</Label>
              <Input value={billingNumber} onChange={(event) => setBillingNumber(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Fábrica</Label>
              <Select options={factoryOptions} value={factoryName} onChange={(event) => { setFactoryName(event.target.value); setBranch(""); setPaymentCondition(""); }} />
            </div>
            <div className="space-y-1.5">
              <Label>Marca / segmento{needsBranch ? "" : " (opcional)"}</Label>
              <Select options={branchOptions} value={selectedBranch} disabled={!factory || !needsBranch} onChange={(event) => setBranch(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Condición de pago</Label>
              <Select options={conditionOptions} value={paymentCondition} disabled={!factory} onChange={(event) => setPaymentCondition(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de documento</Label>
              <Select options={[{ value: "Factura", label: "Factura" }, { value: "Remito", label: "Remito" }]} value={type} onChange={(event) => setType(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha de recepción</Label>
              <DateInput value={deliveryDate} onChange={setDeliveryDate} />
            </div>
            <div className="space-y-1.5">
              <Label>Total</Label>
              <Input type="number" min="0" step="0.01" value={total} onChange={(event) => setTotal(event.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={handleSave} disabled={!canSave} loading={updateInvoice.isPending}>
                <Save className="h-4 w-4" />
                {updateInvoice.isPending ? "Guardando..." : "Guardar cambios"}
              </Button>
              {!canSave && !updateInvoice.isPending && missing.length > 0 && (
                <p className="text-sm text-muted-foreground">Falta: {missing.join(", ")}.</p>
              )}
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}