import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { useClient } from "@/presentation/hooks/useClients";
import { useFactories } from "@/presentation/hooks/useFactories";
import { useCreateBuyOrder } from "@/presentation/hooks/useBuyOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Select } from "@/presentation/components/ui/select";
import { Textarea } from "@/presentation/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { formatMoney } from "@/lib/utils";
import { clientDetailPath } from "@/presentation/routes/routes";
import type { ArticleOrderModel } from "@/domain/entities/buyOrder";
import { Plus, Trash2 } from "lucide-react";

const emptyArticle: ArticleOrderModel = { name: "", color: "", delivered: 0, pairs: 0, value: 0 };

export default function CreateOrder() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { appUser } = useAuth();
  const { data: client } = useClient(appUser?.uid, clientId);
  const { data: factories } = useFactories(appUser?.uid);
  const createOrder = useCreateBuyOrder(appUser?.uid, clientId);

  const [factory, setFactory] = useState("");
  const [branch, setBranch] = useState("");
  const [paymentCondition, setPaymentCondition] = useState("");
  const [discount, setDiscount] = useState("0");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [comments, setComments] = useState("");
  const [articles, setArticles] = useState<ArticleOrderModel[]>([{ ...emptyArticle }]);
  const [error, setError] = useState("");

  const validArticles = articles.filter((a) => a.name.trim() && a.pairs > 0);
  const missing: string[] = [];
  if (!factory) missing.push("fábrica");
  if (!branch) missing.push("marca");
  if (validArticles.length === 0) missing.push("al menos un artículo con pares > 0");
  const canSubmit = !!client && missing.length === 0 && !createOrder.isPending;

  const selectedFactory = factories?.find((f) => f.name === factory);
  const selectedCondition = selectedFactory?.paymentType.find((p) => p.paymentName === paymentCondition);
  const factoryOptions = (factories ?? []).map((f) => ({ value: f.name, label: f.name }));
  const branchOptions = (selectedFactory?.branchList ?? []).map((b) => ({ value: b, label: b }));
  const conditionOptions = (selectedFactory?.paymentType ?? []).map((p) => ({
    value: p.paymentName,
    label: p.paymentName,
  }));

  useEffect(() => {
    if (selectedCondition) {
      setDiscount(String(selectedCondition.discount));
    }
  }, [selectedCondition]);

  const effectiveDiscount = selectedCondition ? selectedCondition.discount : parseFloat(discount) || 0;

  const total = useMemo(() => {
    const gross = articles.reduce((sum, a) => sum + (a.value ?? 0) * a.pairs, 0);
    return gross * (1 - effectiveDiscount / 100);
  }, [articles, effectiveDiscount]);

  const updateArticle = (idx: number, patch: Partial<ArticleOrderModel>) => {
    setArticles((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  };

  const handleSubmit = async () => {
    setError("");
    if (!clientId || !client) {
      setError("El cliente todavía no se cargó. Esperá un momento e intentá de nuevo.");
      return;
    }
    if (!factory || !branch) {
      setError("Seleccioná una fábrica y una marca antes de guardar.");
      return;
    }
    if (validArticles.length === 0) {
      setError("Agregá al menos un artículo con nombre y pares mayores a 0.");
      return;
    }
    try {
      await createOrder.mutateAsync({
        clientId,
        client: client.clientName,
        factory,
        branch,
        deliveryDate: deliveryDate ? new Date(deliveryDate).getTime() : 0,
        type: "Pedido",
        billing: "",
        comments,
        articles: validArticles,
        loadedDate: Date.now(),
        paymentCondition,
        discount: effectiveDiscount,
        expirationDays: selectedCondition?.expiration ?? 0,
        timeStamp: Date.now(),
      });
      navigate(clientDetailPath(clientId));
    } catch {
      setError("No se pudo guardar el pedido. Revisá tu conexión e intentá de nuevo.");
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo pedido</h1>
        <p className="text-sm text-muted-foreground">Cliente: {client?.clientName}</p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Datos generales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Fábrica</Label>
            <Select
              options={factoryOptions}
              placeholder="Seleccionar fábrica"
              value={factory}
              onChange={(e) => {
                setFactory(e.target.value);
                setBranch("");
                setPaymentCondition("");
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Marca</Label>
            <Select options={branchOptions} placeholder="Seleccionar marca" value={branch} onChange={(e) => setBranch(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Condición de pago</Label>
            <Select
              options={conditionOptions}
              placeholder="Seleccionar condición"
              value={paymentCondition}
              onChange={(e) => setPaymentCondition(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Descuento (%)</Label>
            <Input
              type="number"
              value={effectiveDiscount}
              onChange={(e) => {
                if (!selectedCondition) setDiscount(e.target.value);
              }}
              readOnly={Boolean(selectedCondition)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Fecha de entrega</Label>
            <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Artículos</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setArticles((prev) => [...prev, { ...emptyArticle }])}>
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artículo</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Pares</TableHead>
                <TableHead>Valor unit.</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((art, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Input value={art.name} onChange={(e) => updateArticle(idx, { name: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input value={art.color} onChange={(e) => updateArticle(idx, { color: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={art.pairs}
                      onChange={(e) => updateArticle(idx, { pairs: parseInt(e.target.value, 10) || 0 })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={art.value}
                      onChange={(e) => updateArticle(idx, { value: parseFloat(e.target.value) || 0 })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setArticles((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 space-y-1.5">
            <Label>Comentarios</Label>
            <Textarea value={comments} onChange={(e) => setComments(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-4 py-3 shadow-sm">
        <span className="text-sm font-medium text-muted-foreground">Total estimado</span>
        <span className="text-2xl font-bold tracking-tight tabular-nums">{formatMoney(total)}</span>
      </div>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <Button onClick={handleSubmit} disabled={!canSubmit}>
        {createOrder.isPending ? "Guardando..." : "Guardar pedido"}
      </Button>
      {!canSubmit && !createOrder.isPending && missing.length > 0 && (
        <p className="text-sm text-muted-foreground">Falta: {missing.join(", ")}.</p>
      )}
    </div>
  );
}
