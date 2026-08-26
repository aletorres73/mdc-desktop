"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAllClients, useFactoriesForOrders, useCreateClient } from "@/hooks";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Loader2, Trash2 } from "lucide-react";
import type { ClientModel } from "@/types/domain";

/**
 * Create Order page — mirrors Kotlin CreateOrderScreen / CreateOrderViewModel
 * Features: client selection, factory selection, article entry
 */
export default function CreateOrder() {
  const navigate = useNavigate();
  const { data: clients } = useAllClients();
  const { data: factories } = useFactoriesForOrders();
  const createClient = useCreateClient();

  const [step, setStep] = useState<"client" | "details" | "articles">("client");
  const [selectedClient, setSelectedClient] = useState<ClientModel | null>(null);
  const [newClientName, setNewClientName] = useState("");
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [showCreateClientDialog, setShowCreateClientDialog] = useState(false);

  const [selectedFactory, setSelectedFactory] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [type, setType] = useState("");
  const [billing, setBilling] = useState("");
  const [comments, setComments] = useState("");
  const [paymentCondition, setPaymentCondition] = useState("");
  const [discount, setDiscount] = useState("");
  const [expirationDays, setExpirationDays] = useState("");

  // Articles
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
    // TODO: Implement create order mutation
    console.log("Creating order:", {
      client: selectedClient,
      factory: selectedFactory,
      branch: selectedBranch,
      deliveryDate,
      type,
      billing,
      comments,
      paymentCondition,
      discount,
      expirationDays,
      articles,
    });
    navigate("/orders");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      <main className="flex-1 min-w-0 p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between">
            {["Cliente", "Detalles", "Artículos"].map((label, i) => (
              <div key={label} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
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
                    className={`ml-2 h-0.5 w-20 ${
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
            <Card>
              <CardHeader>
                <CardTitle>Seleccionar cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative max-w-md">
                  <Select
                    value={selectedClient?.clientId ?? ""}
                    onValueChange={(v) => {
                      const client = clients?.find((c) => c.clientId === v);
                      setSelectedClient(client ?? null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Buscar cliente..." />
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
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear nuevo cliente
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={!selectedClient}
                  className="w-full"
                >
                  Continuar
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "details" && (
            <Card>
              <CardHeader>
                <CardTitle>Detalles del pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="factory">Fábrica</Label>
                    <Select
                      value={selectedFactory}
                      onValueChange={(v) => setSelectedFactory(v ?? "")}
                    >
                      <SelectTrigger>
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

                  <div>
                    <Label htmlFor="branch">Marca</Label>
                    <Input
                      id="branch"
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      placeholder="Marca/Segmento"
                    />
                  </div>

                  <div>
                    <Label htmlFor="deliveryDate">Fecha entrega</Label>
                    <Input
                      id="deliveryDate"
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Tipo</Label>
                    <Input
                      id="type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      placeholder="Tipo de pedido"
                    />
                  </div>

                  <div>
                    <Label htmlFor="billing">Facturación</Label>
                    <Input
                      id="billing"
                      value={billing}
                      onChange={(e) => setBilling(e.target.value)}
                      placeholder="Facturación"
                    />
                  </div>

                  <div>
                    <Label htmlFor="paymentCondition">Condición de pago</Label>
                    <Input
                      id="paymentCondition"
                      value={paymentCondition}
                      onChange={(e) => setPaymentCondition(e.target.value)}
                      placeholder="Condición de pago"
                    />
                  </div>

                  <div>
                    <Label htmlFor="discount">Descuento %</Label>
                    <Input
                      id="discount"
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="expirationDays">Días vencimiento</Label>
                    <Input
                      id="expirationDays"
                      type="number"
                      value={expirationDays}
                      onChange={(e) => setExpirationDays(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="comments">Comentarios</Label>
                  <Input
                    id="comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Comentarios adicionales"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleBack}>
                    Volver
                  </Button>
                  <Button onClick={handleNext} disabled={!selectedFactory || !selectedBranch}>
                    Continuar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "articles" && (
            <Card>
              <CardHeader>
                <CardTitle>Artículos del pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <Label htmlFor="articleName">Artículo</Label>
                    <Input
                      id="articleName"
                      value={newArticle.name}
                      onChange={(e) => setNewArticle({ ...newArticle, name: e.target.value })}
                      placeholder="Nombre del artículo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="articleColor">Color</Label>
                    <Input
                      id="articleColor"
                      value={newArticle.color}
                      onChange={(e) => setNewArticle({ ...newArticle, color: e.target.value })}
                      placeholder="Color"
                    />
                  </div>
                  <div>
                    <Label htmlFor="articleDelivered">Entregados</Label>
                    <Input
                      id="articleDelivered"
                      type="number"
                      value={newArticle.delivered}
                      onChange={(e) => setNewArticle({ ...newArticle, delivered: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="articlePairs">Pares</Label>
                    <Input
                      id="articlePairs"
                      type="number"
                      value={newArticle.pairs}
                      onChange={(e) => setNewArticle({ ...newArticle, pairs: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <Button onClick={handleAddArticle} disabled={!newArticle.name || !newArticle.color}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar artículo
                </Button>

                {articles.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-2 pr-4">Artículo</th>
                          <th className="pb-2 pr-4">Color</th>
                          <th className="pb-2 pr-4 text-right">Entregados</th>
                          <th className="pb-2 pr-4 text-right">Pares</th>
                          <th className="pb-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {articles.map((article, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 pr-4">{article.name}</td>
                            <td className="py-2 pr-4">{article.color}</td>
                            <td className="py-2 pr-4 text-right">{article.delivered}</td>
                            <td className="py-2 pr-4 text-right">{article.pairs}</td>
                            <td className="py-2">
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveArticle(i)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={handleBack}>
                    Volver
                  </Button>
                  <Button onClick={handleSubmit} disabled={articles.length === 0}>
                    {articles.length === 0 ? "Agregar al menos un artículo" : "Crear pedido"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Create Client Dialog */}
          <Dialog open={showCreateClientDialog} onOpenChange={setShowCreateClientDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear nuevo cliente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="newClientName">Razón Social</Label>
                  <Input
                    id="newClientName"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Nombre del cliente"
                    autoFocus
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateClientDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    if (!newClientName.trim()) return;
                    setIsCreatingClient(true);
                    try {
                      const newClient = await createClient.mutateAsync({ clientName: newClientName.trim() });
                      setSelectedClient(newClient);
                      setNewClientName("");
                      setShowCreateClientDialog(false);
                    } catch (err) {
                      console.error("Error creating client:", err);
                    } finally {
                      setIsCreatingClient(false);
                    }
                  }}
                  disabled={isCreatingClient || !newClientName.trim()}
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
        </div>
      </main>
    </div>
  );
}