"use client";

import { useState } from "react";
import { useCreateFactory, useUpdateFactory } from "@/hooks";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/presentation/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Plus, Trash2, Loader2, Package } from "lucide-react";
import type { FactoryModel, PaymentCondition } from "@/types/domain";

interface FactoryFormProps {
  factory?: FactoryModel | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const DEFAULT_PAYMENT_CONDITION: PaymentCondition = {
  paymentName: "",
  discount: 0,
  month: 0,
  expiration: 0,
  date: 0,
  quantity: 0,
};

export function FactoryForm({ factory, onSuccess, onCancel }: FactoryFormProps) {
  const createFactory = useCreateFactory();
  const updateFactory = useUpdateFactory();

  const isEditing = !!factory;

  // Form state
  const [name, setName] = useState(factory?.name ?? "");
  const [defaultCommission, setDefaultCommission] = useState(factory?.defaultCommission ?? 0);
  const [brands, setBrands] = useState<string[]>(factory?.branchList ?? [""]);
  const [paymentConditions, setPaymentConditions] = useState<PaymentCondition[]>(
    factory?.paymentType ?? [DEFAULT_PAYMENT_CONDITION]
  );
  const [segmentCommissions, setSegmentCommissions] = useState<Record<string, number>>(
    factory?.segmentCommissions ?? {}
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Handle brand changes
  const handleBrandChange = (index: number, value: string) => {
    const newBrands = [...brands];
    newBrands[index] = value;
    setBrands(newBrands);
  };

  const handleAddBrand = () => {
    setBrands([...brands, ""]);
  };

  const handleRemoveBrand = (index: number) => {
    if (brands.length <= 1) return;
    const newBrands = brands.filter((_, i) => i !== index);
    setBrands(newBrands);
  };

  // Handle payment condition changes
  const handlePaymentConditionChange = (index: number, field: keyof PaymentCondition, value: string | number) => {
    const newConditions = [...paymentConditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setPaymentConditions(newConditions);
  };

  const handleAddPaymentCondition = () => {
    setPaymentConditions([...paymentConditions, DEFAULT_PAYMENT_CONDITION]);
  };

  const handleRemovePaymentCondition = (index: number) => {
    if (paymentConditions.length <= 1) return;
    const newConditions = paymentConditions.filter((_, i) => i !== index);
    setPaymentConditions(newConditions);
  };

  // Handle segment commission changes
  const handleSegmentCommissionChange = (segment: string, value: string) => {
    const num = parseFloat(value) || 0;
    setSegmentCommissions((prev) => ({
      ...prev,
      [segment]: num,
    }));
  };

  const handleAddSegment = () => {
    const segmentName = prompt("Nombre del segmento:");
    if (segmentName) {
      setSegmentCommissions((prev) => ({ ...prev, [segmentName]: 0 }));
    }
  };

  const handleRemoveSegment = (segment: string) => {
    setSegmentCommissions((prev) => {
      const next = { ...prev };
      delete next[segment];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("El nombre de la fábrica es obligatorio");
      return;
    }

    // Filter out empty brands
    const validBrands = brands.filter((b) => b.trim());

    // Filter out empty payment conditions
    const validConditions = paymentConditions.filter(
      (pc) => pc.paymentName.trim() || pc.discount > 0 || pc.month > 0
    );

    const factoryData: FactoryModel = {
      name: name.trim(),
      branchList: validBrands,
      paymentType: validConditions,
      defaultCommission: defaultCommission || 0,
      segmentCommissions,
    };

    setIsSubmitting(true);

    try {
      if (isEditing) {
        await updateFactory.mutateAsync(factoryData);
      } else {
        await createFactory.mutateAsync(factoryData);
      }
      onSuccess();
    } catch (err) {
      console.error("Error saving factory:", err);
      alert("Error al guardar la fábrica");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar fábrica" : "Nueva fábrica"}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100%-80px)]">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Datos básicos</TabsTrigger>
            <TabsTrigger value="brands">Marcas</TabsTrigger>
            <TabsTrigger value="payments">Condiciones de pago</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="p-4 overflow-y-auto h-[calc(100%-50px)]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la fábrica *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Fábrica Textil Sur"
                  disabled={isEditing} // Name is the document ID, can't change on edit
                />
                {isEditing && (
                  <p className="text-xs text-muted-foreground">
                    El nombre no se puede cambiar (es el ID del documento)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultCommission">Comisión base (%)</Label>
                <Input
                  id="defaultCommission"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={defaultCommission}
                  onChange={(e) => setDefaultCommission(parseFloat(e.target.value) || 0)}
                  placeholder="12.5"
                />
              </div>

              <div className="space-y-2">
                <Label>Comisiones por segmento</Label>
                <Card>
                  <CardHeader className="pb-2 flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Comisiones por segmento</CardTitle>
                    <Button variant="ghost" size="sm" onClick={handleAddSegment}>
                      <Plus className="mr-1 h-3 w-3" />
                      Agregar
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(segmentCommissions).length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Sin segmentos configurados
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(segmentCommissions).map(([segment, commission]) => (
                          <div key={segment} className="flex items-center gap-2">
                            <Input
                              value={segment}
                              readOnly
                              className="w-40 bg-muted"
                            />
                            <Label className="w-8 text-center">%</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={commission}
                              onChange={(e) => handleSegmentCommissionChange(segment, e.target.value)}
                              className="w-24"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveSegment(segment)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Brands Tab */}
          <TabsContent value="brands" className="p-4 overflow-y-auto h-[calc(100%-50px)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Marcas de la fábrica</Label>
                <Button variant="outline" size="sm" onClick={handleAddBrand}>
                  <Plus className="mr-1 h-3 w-3" />
                  Agregar marca
                </Button>
              </div>

              <Card>
                <CardContent className="pt-0">
                  {brands.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Sin marcas configuradas
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {brands.map((brand, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <Input
                            value={brand}
                            onChange={(e) => handleBrandChange(index, e.target.value)}
                            placeholder="Nombre de la marca"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveBrand(index)}
                            disabled={brands.length <= 1}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payment Conditions Tab */}
          <TabsContent value="payments" className="p-4 overflow-y-auto h-[calc(100%-50px)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Condiciones de pago</Label>
                <Button variant="outline" size="sm" onClick={handleAddPaymentCondition}>
                  <Plus className="mr-1 h-3 w-3" />
                  Agregar condición
                </Button>
              </div>

              <Card>
                <CardContent className="pt-0">
                  {paymentConditions.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Sin condiciones de pago configuradas
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {paymentConditions.map((pc, index) => (
                        <Card key={index} className="bg-muted/50">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium">
                                Condición #{index + 1}
                              </CardTitle>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemovePaymentCondition(index)}
                                disabled={paymentConditions.length <= 1}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-1">
                                <Label htmlFor={`paymentName-${index}`}>Nombre *</Label>
                                <Input
                                  id={`paymentName-${index}`}
                                  value={pc.paymentName}
                                  onChange={(e) => handlePaymentConditionChange(index, "paymentName", e.target.value)}
                                  placeholder="Ej: Contado, 30 días, 60 días"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor={`discount-${index}`}>Descuento (%)</Label>
                                <Input
                                  id={`discount-${index}`}
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="100"
                                  value={pc.discount}
                                  onChange={(e) => handlePaymentConditionChange(index, "discount", parseFloat(e.target.value) || 0)}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor={`month-${index}`}>Meses</Label>
                                <Input
                                  id={`month-${index}`}
                                  type="number"
                                  min="0"
                                  value={pc.month}
                                  onChange={(e) => handlePaymentConditionChange(index, "month", parseInt(e.target.value) || 0)}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor={`expiration-${index}`}>Vencimiento (días)</Label>
                                <Input
                                  id={`expiration-${index}`}
                                  type="number"
                                  min="0"
                                  value={pc.expiration}
                                  onChange={(e) => handlePaymentConditionChange(index, "expiration", parseInt(e.target.value) || 0)}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor={`date-${index}`}>Plazo (días)</Label>
                                <Input
                                  id={`date-${index}`}
                                  type="number"
                                  min="0"
                                  value={pc.date}
                                  onChange={(e) => handlePaymentConditionChange(index, "date", parseInt(e.target.value) || 0)}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor={`quantity-${index}`}>Cantidad de pagos</Label>
                                <Input
                                  id={`quantity-${index}`}
                                  type="number"
                                  min="0"
                                  value={pc.quantity}
                                  onChange={(e) => handlePaymentConditionChange(index, "quantity", parseInt(e.target.value) || 0)}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              isEditing ? "Actualizar" : "Crear"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}