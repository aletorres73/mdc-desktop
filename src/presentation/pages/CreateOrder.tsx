import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { useClient } from "@/presentation/hooks/useClients";
import { useFactories } from "@/presentation/hooks/useFactories";
import { useBuyOrder, useCreateBuyOrder, useUpdateBuyOrder } from "@/presentation/hooks/useBuyOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Select } from "@/presentation/components/ui/select";
import { Textarea } from "@/presentation/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { clientDetailPath, orderDetailPath } from "@/presentation/routes/routes";
import { DateInput } from "@/presentation/components/shared/DateInput";
import { toLocalISODate, parseLocalISODate } from "@/lib/utils";
import type { ArticleOrderModel, BuyOrderModel } from "@/domain/entities/buyOrder";
import { Plus, Trash2 } from "lucide-react";

const emptyArticle: ArticleOrderModel = { name: "", color: "", delivered: 0, pairs: 12, value: 0 };

export default function CreateOrder() {
  const { clientId, orderId } = useParams<{ clientId: string; orderId: string }>();
  const navigate = useNavigate();
  const { appUser } = useAuth();
  const { data: client } = useClient(appUser?.uid, clientId);
  const { data: factories } = useFactories(appUser?.uid);
  const { data: order, isLoading: isOrderLoading } = useBuyOrder(appUser?.uid, clientId, orderId);
  const createOrder = useCreateBuyOrder(appUser?.uid, clientId);
  const updateOrder = useUpdateBuyOrder(appUser?.uid, clientId);
  const isEditing = !!orderId;

  const [factory, setFactory] = useState("");
  const [branch, setBranch] = useState("");
  const [paymentCondition, setPaymentCondition] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [comments, setComments] = useState("");
  const [articles, setArticles] = useState<ArticleOrderModel[]>([{ ...emptyArticle }]);
  const [error, setError] = useState("");
  const articleNameRefs = useRef<(HTMLInputElement | null)[]>([]);

  const addArticle = () => {
    setArticles((prev) => {
      const lastArticle = prev[prev.length - 1] ?? { ...emptyArticle };
      return [...prev, { ...emptyArticle, name: lastArticle.name }];
    });
    requestAnimationFrame(() => {
      const inputs = articleNameRefs.current;
      inputs[inputs.length - 1]?.focus();
    });
  };

  const handleArticleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addArticle();
      return;
    }
    if (!e.key.startsWith("Arrow")) return;

    const input = e.currentTarget;
    const cell = input.closest("td");
    const row = cell?.closest("tr");
    const tbody = row?.parentElement;
    if (!cell || !row || !tbody) return;

    const rows = Array.from(tbody.querySelectorAll("tr"));
    const rowIdx = rows.indexOf(row);
    const cells = Array.from(row.querySelectorAll("td"));
    const colIdx = cells.indexOf(cell);

    if (input.type === "number" && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      const step = e.key === "ArrowUp" ? 12 : -12;
      const current = Number.parseInt(input.value, 10);
      const base = Number.isFinite(current) ? current : 0;
      updateArticle(rowIdx, { pairs: Math.max(0, base + step) });
      return;
    }

    let target: HTMLInputElement | null = null;
    if (e.key === "ArrowUp") {
      target = rows[rowIdx - 1]?.querySelectorAll("td")[colIdx]?.querySelector("input") ?? null;
    } else if (e.key === "ArrowDown") {
      target = rows[rowIdx + 1]?.querySelectorAll("td")[colIdx]?.querySelector("input") ?? null;
    } else if (e.key === "ArrowLeft") {
      const atStart = input.selectionStart === null || input.selectionStart === 0;
      if (atStart) target = cells[colIdx - 1]?.querySelector("input") ?? null;
    } else if (e.key === "ArrowRight") {
      const atEnd = input.selectionStart === null || input.selectionStart === input.value.length;
      if (atEnd) target = cells[colIdx + 1]?.querySelector("input") ?? null;
    }

    if (target) {
      e.preventDefault();
      target.focus();
      target.select();
    }
  };

  useEffect(() => {
    if (!order) return;
    setFactory(order.factory);
    setBranch(order.branch);
    setPaymentCondition(order.paymentCondition);
    setDeliveryDate(order.deliveryDate ? toLocalISODate(order.deliveryDate) : "");
    setComments(order.comments);
    setArticles(order.articles.length ? order.articles : [{ ...emptyArticle }]);
  }, [order]);

  const validArticles = articles.filter((a) => a.name.trim() && a.pairs > 0);
  const missing: string[] = [];
  if (!factory) missing.push("fábrica");
  // if (!branch) missing.push("marca");
  if (validArticles.length === 0) missing.push("al menos un artículo con pares > 0");
  const isSaving = createOrder.isPending || updateOrder.isPending;
  const canSubmit = !!client && missing.length === 0 && !isSaving;

  if (isEditing && isOrderLoading) return <LoadingState className="min-h-[60vh]" />;
  if (isEditing && !order) return <p className="text-muted-foreground">Pedido no encontrado.</p>;

  const selectedFactory = factories?.find((f) => f.name === factory);
  const selectedCondition = selectedFactory?.paymentType.find((p) => p.paymentName === paymentCondition);
  const factoryOptions = (factories ?? []).map((f) => ({ value: f.name, label: f.name }));
  const branchOptions = (selectedFactory?.branchList ?? []).map((b) => ({ value: b, label: b }));
  const conditionOptions = (selectedFactory?.paymentType ?? []).map((p) => ({
    value: p.paymentName,
    label: p.paymentName,
  }));

  const updateArticle = (idx: number, patch: Partial<ArticleOrderModel>) => {
    setArticles((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  };

  const handleSubmit = async () => {
    setError("");
    if (!clientId || !client) {
      setError("El cliente todavía no se cargó. Esperá un momento e intentá de nuevo.");
      return;
    }
    if (!factory /*|| !branch*/) {
      setError("Seleccioná una fábrica antes de guardar.");
      return;
    }
    if (validArticles.length === 0) {
      setError("Agregá al menos un artículo con nombre y pares mayores a 0.");
      return;
    }
    try {
      const orderData: Omit<BuyOrderModel, "id" | "order"> = {
        clientId,
        client: client.clientName,
        factory,
        branch,
        deliveryDate: deliveryDate ? parseLocalISODate(deliveryDate) : 0,
        type: order?.type ?? "Pedido",
        billing: order?.billing ?? "",
        comments,
        articles: validArticles,
        loadedDate: order?.loadedDate ?? Date.now(),
        paymentCondition,
        discount: selectedCondition?.discount ?? order?.discount ?? 0,
        expirationDays: selectedCondition?.expiration ?? order?.expirationDays ?? 0,
        timeStamp: Date.now(),
      };
      if (isEditing && order) {
        await updateOrder.mutateAsync({ ...order, ...orderData });
        navigate(orderDetailPath(clientId, order.id));
      } else {
        await createOrder.mutateAsync(orderData);
        navigate(clientDetailPath(clientId));
      }
    } catch {
      setError("No se pudo guardar el pedido. Revisá tu conexión e intentá de nuevo.");
    }
  };

  const handleCancel = () => {
    navigate(isEditing && order ? orderDetailPath(clientId!, order.id) : clientDetailPath(clientId ?? ""));
  };

  return (
    <div className="flex w-full max-w-[1600px] flex-col gap-6 px-2 py-2 sm:px-3 lg:px-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isEditing ? `Editar pedido ${order?.order ?? ""}` : "Nuevo pedido"}</h1>
          <p className="text-sm text-muted-foreground">Cliente: {client?.clientName}</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
          {factory ? `Fábrica: ${factory}` : "Sin fábrica seleccionada"}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2.5fr)_320px]">
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Datos generales</CardTitle>
              <p className="text-sm text-muted-foreground">Los campos con * son obligatorios.</p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>*Fábrica</Label>
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
                <Label>Marca / Segmento</Label>
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
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Fecha de entrega</Label>
                <DateInput value={deliveryDate} onChange={setDeliveryDate} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Artículos</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={addArticle}
              >
                <Plus className="h-4 w-4" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Artículo</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Pares</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles.map((art, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Input
                            ref={(el) => {
                              articleNameRefs.current[idx] = el;
                            }}
                            value={art.name}
                            onChange={(e) => updateArticle(idx, { name: e.target.value })}
                            onKeyDown={handleArticleKeyDown}
                          />
                        </TableCell>
                        <TableCell>
                          <Input value={art.color} onChange={(e) => updateArticle(idx, { color: e.target.value })} onKeyDown={handleArticleKeyDown} />
                        </TableCell>
                        <TableCell className="align-middle">
                          <Input
                            type="number"
                            min={0}
                            step={12}
                            value={art.pairs}
                            onChange={(e) => {
                              const rawValue = Number.parseInt(e.target.value, 10);
                              const nextValue = Number.isFinite(rawValue) && rawValue >= 0 ? rawValue : 0;
                              updateArticle(idx, { pairs: nextValue });
                            }}
                            onBlur={(e) => {
                              const value = Number.parseInt(e.target.value, 10);
                              if (!Number.isFinite(value) || value < 0) {
                                updateArticle(idx, { pairs: 0 });
                              }
                            }}
                            onKeyDown={handleArticleKeyDown}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            tabIndex={-1}
                            onClick={() => setArticles((prev) => prev.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 space-y-1.5">
                <Label>Comentarios</Label>
                <Textarea value={comments} onChange={(e) => setComments(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={handleSubmit} disabled={!canSubmit || (isEditing && isOrderLoading)} loading={isSaving}>
                {isSaving ? "Guardando..." : isEditing ? "Guardar cambios" : "Guardar pedido"}
              </Button>
              <Button className="w-full" variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancelar
              </Button>
              {!canSubmit && !createOrder.isPending && missing.length > 0 && (
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
