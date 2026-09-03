"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAllClients } from "../hooks/useClients";
import { useFactoriesForOrders, useCreateBuyOrder } from "../hooks/useOrders";
import { useCreateClient } from "../hooks/useClients";
import { PageShell, PageHeader, DataTableShell, DataTableRow, DataTableCell } from "../components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/presentation/components/ui/dialog";
import { Plus, Loader2, Trash2, Package } from "lucide-react";
import type { ClientModel } from "@/domain/entities/client";
import type { BuyOrderModel } from "@/domain/entities/order";
import { ROUTES } from "../routes/routes";

export default function CreateOrder() {
  const navigate = useNavigate();
  const { data: clients } = useAllClients();
  const { data: factories } = useFactoriesForOrders();
  const createClient = useCreateClient();
  const createBuyOrder = useCreateBuyOrder();

  const [step, setStep] = useState<"client" | "details" | "articles">("client");
  const [selectedClient, setSelectedClient] = useState<ClientModel | null>(null);
  const [newClientName, setNewClientName] = useState("");
  const [newClientId, setNewClientId] = useState("");
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [showCreateClientDialog, setShowCreateClientDialog] = useState(false);

  const [selectedFactory, setSelectedFactory] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [type, setType] = useState("Original");
  const [billing, setBilling] = useState("Factura");
  const [comments, setComments] = useState("");
  const [paymentCondition, setPaymentCondition] = useState("");
  const [discount, setDiscount] = useState("");
  const [expirationDays, setExpirationDays] = useState("");

  const [articles, setArticles] = useState<Array<{
    name: string;
    color: string;
    delivered: number;
    pairs: number;
  }>>([]);

  const [newArticle, setNewArticle] = useState({
    name: "",
    color: "",
    delivered: 0,
    pairs: 0,
  });

  const handleNext = () => {
    if (step === "client" && selectedClient) {
      setStep("details");
    } else if (step === "details" && selectedFactory && selectedBranch) {
      setStep("articles");
    }
  };

  const handleBack = () => {
    if (step === "details") setStep("client");
    else if (step === "articles") setStep("details");
  };

  const handleAddArticle = () => {
    if (!newArticle.name || !newArticle.color) return;
    setArticles([...articles, { ...newArticle }]);
    setNewArticle({ name: "", color: "", delivered: 0, pairs: 0 });
  };

  const handleRemoveArticle = (index: number) => {
    setArticles(articles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedClient || !selectedFactory || !selectedBranch) return;

    const deliveryMillis = deliveryDate ? new Date(deliveryDate).getTime() : Date.now();
    const orderData: BuyOrderModel = {
      id: `ord_${Date.now()}`,
      clientId: selectedClient.clientId,
      order: String(Date.now()).slice(-6),
      client: selectedClient.clientName,
      factory: selectedFactory,
      branch: selectedBranch,
      deliveryDate: deliveryMillis,
      type,
      billing,
      comments,
      articles,
      loadedDate: Date.now(),
      paymentCondition,
      discount: parseFloat(discount) || 0,
      expirationDays: parseInt(expirationDays) || 0,
      timeStamp: Date.now(),
    };

    try {
      await createBuyOrder.mutateAsync({ clientId: selectedClient.clientId, order: orderData });
      navigate(ROUTES.ORDERS);
    } catch (err) {
      console.error("Error creating buy order:", err);
    }
  };

  return (
    <PageShell maxWidth="narrow">
      <PageHeader
        title="Crear Nuevo Pedido"
        description="Paso a paso para registrar una orden de compra"
        icon={Package}
      />

      <div className="flex items-center justify-between py-2">
        {["Cliente", "Detalles", "Artículos"].map((label, i) => (
          <div key={label} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                i <= (step === "client" ? 0 : step === "details" ? 1 : 2)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            <span className="ml-2 text-sm font-medium">{label}</span>
            {i < 2 && (
              <div
                className={`ml-2 h-0.5 w-16 sm:w-24 ${
                  i < (step === "client" ? 0 : step === "details" ? 1 : 2)
                    ? "bg-primary"
                    : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {step === "client" && (
        <Card className="border-border/50 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">1. Seleccionar cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-md">
              <Label>Cliente registrado</Label>
              <Select
                value={selectedClient?.clientId ?? ""}
                onValueChange={(v) => {
                  const client = clients?.find((c) => c.clientId === v);
                  setSelectedClient(client ?? null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Buscar cliente por razón social..." />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.clientId} value={client.clientId}>
                      {client.clientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowCreateClientDialog(true)}
              className="w-full max-w-md"
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear nuevo cliente
            </Button>

            <div className="pt-4 border-t flex justify-end">
              <Button onClick={handleNext} disabled={!selectedClient}>
                Continuar a Detalles
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "details" && (
        <Card className="border-border/50 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">2. Detalles del pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="factory">Fábrica *</Label>
                <Select value={selectedFactory} onValueChange={(v) => setSelectedFactory(v ?? "")}>
                  <SelectTrigger id="factory">
                    <SelectValue placeholder="Seleccionar fábrica" />
                  </SelectTrigger>
                  <SelectContent>
                    {factories?.map((factory) => (
                      <SelectItem key={factory} value={factory}>
                        {factory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="branch">Marca / Segmento *</Label>
                <Input
                  id="branch"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  placeholder="Ej: Calzado Deportivo"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="deliveryDate">Fecha estimada de entrega</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="type">Tipo de pedido</Label>
                <Input
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="Original / Reposición"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="billing">Facturación</Label>
                <Input
                  id="billing"
                  value={billing}
                  onChange={(e) => setBilling(e.target.value)}
                  placeholder="Factura / Remito"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="paymentCondition">Condición de pago</Label>
                <Input
                  id="paymentCondition"
                  value={paymentCondition}
                  onChange={(e) => setPaymentCondition(e.target.value)}
                  placeholder="Ej: Contado, 30 días"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="discount">Descuento (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.1"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expirationDays">Días vencimiento</Label>
                <Input
                  id="expirationDays"
                  type="number"
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(e.target.value)}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comments">Comentarios adicionales</Label>
              <Input
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Observaciones de entrega, transporte, etc."
              />
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleBack}>
                Volver
              </Button>
              <Button onClick={handleNext} disabled={!selectedFactory || !selectedBranch}>
                Continuar a Artículos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "articles" && (
        <Card className="border-border/50 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">3. Artículos del pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4 items-end bg-muted/30 p-4 border border-border/40 rounded-lg">
              <div>
                <Label htmlFor="articleName" className="text-xs">Artículo</Label>
                <Input
                  id="articleName"
                  value={newArticle.name}
                  onChange={(e) => setNewArticle({ ...newArticle, name: e.target.value })}
                  placeholder="Nombre"
                />
              </div>
              <div>
                <Label htmlFor="articleColor" className="text-xs">Color</Label>
                <Input
                  id="articleColor"
                  value={newArticle.color}
                  onChange={(e) => setNewArticle({ ...newArticle, color: e.target.value })}
                  placeholder="Color"
                />
              </div>
              <div>
                <Label htmlFor="articleDelivered" className="text-xs">Entregados</Label>
                <Input
                  id="articleDelivered"
                  type="number"
                  value={newArticle.delivered}
                  onChange={(e) => setNewArticle({ ...newArticle, delivered: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="articlePairs" className="text-xs">Pares</Label>
                <Input
                  id="articlePairs"
                  type="number"
                  value={newArticle.pairs}
                  onChange={(e) => setNewArticle({ ...newArticle, pairs: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <Button onClick={handleAddArticle} disabled={!newArticle.name || !newArticle.color} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Agregar artículo
            </Button>

            {articles.length > 0 && (
              <DataTableShell headers={["Artículo", "Color", "Entregados", "Pares", ""]}>
                {articles.map((article, i) => (
                  <DataTableRow key={i}>
                    <DataTableCell className="font-medium">{article.name}</DataTableCell>
                    <DataTableCell>{article.color}</DataTableCell>
                    <DataTableCell className="text-right font-mono text-muted-foreground">{article.delivered}</DataTableCell>
                    <DataTableCell className="text-right font-mono font-semibold">{article.pairs}</DataTableCell>
                    <DataTableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveArticle(i)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableShell>
            )}

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleBack}>
                Volver
              </Button>
              <Button onClick={handleSubmit} disabled={articles.length === 0 || createBuyOrder.isPending}>
                {createBuyOrder.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando pedido...
                  </>
                ) : (
                  "Crear pedido"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCreateClientDialog} onOpenChange={setShowCreateClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear nuevo cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newClientId">ID del cliente</Label>
              <Input
                id="newClientId"
                value={newClientId}
                onChange={(e) => setNewClientId(e.target.value)}
                placeholder="ID único"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="newClientName">Razón Social</Label>
              <Input
                id="newClientName"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Nombre del cliente"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateClientDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!newClientId.trim() || !newClientName.trim()) return;
                setIsCreatingClient(true);
                try {
                  const newClient = await createClient.mutateAsync({ clientId: newClientId.trim(), clientName: newClientName.trim() });
                  setSelectedClient(newClient);
                  setNewClientName("");
                  setNewClientId("");
                  setShowCreateClientDialog(false);
                } catch (err) {
                  console.error("Error creating client:", err);
                } finally {
                  setIsCreatingClient(false);
                }
              }}
              disabled={isCreatingClient || !newClientId.trim() || !newClientName.trim()}
            >
              {isCreatingClient ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear y seleccionar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
