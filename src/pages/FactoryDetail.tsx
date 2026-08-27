"use client";

import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useFactory, useFactoryPaymentConditions, useDeleteFactory } from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Factory, Package, AlertCircle, Trash2, Edit, Plus } from "lucide-react";
import { FactoryForm } from "@/components/FactoryForm";
import type { FactoryModel } from "@/types/domain";

/**
 * Factory Detail page — mirrors Kotlin FactoryDetailScreen / FactoryViewModel
 * Shows factory details, brands, commissions, payment conditions
 */
export default function FactoryDetail() {
  const { factoryName } = useParams<{ factoryName: string }>();
  const navigate = useNavigate();
  const { data: factory, isLoading, error } = useFactory(factoryName ?? null);
  const { data: paymentConditions } = useFactoryPaymentConditions(factoryName ?? null);
  const deleteFactory = useDeleteFactory();
  const [editingFactory, setEditingFactory] = useState<FactoryModel | null>(null);

  if (isLoading) {
    return (
      <main className="min-h-svh w-full p-4 sm:p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cargando fábrica...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
      </main>
    );
  }

  if (error || !factory) {
    return (
      <main className="min-h-svh w-full p-4 sm:p-6">
          <div className="mx-auto max-w-4xl">
            <Card>
              <CardContent className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <h2 className="text-xl font-semibold mb-2">Fábrica no encontrada</h2>
                <p className="text-muted-foreground mb-4">
                  No se pudo cargar la fábrica {factoryName}
                </p>
                <Link to="/factories">
                  <Button variant="outline">Volver al listado</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
      </main>
    );
  }

  return (
    <main className="min-h-svh w-full p-4 sm:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header with back button */}
          <div className="flex items-center gap-4">
            <Link to="/factories">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Factory className="h-8 w-8 text-primary" />
                <h1 className="truncate text-2xl font-bold tracking-tight">{factory.name}</h1>
              </div>
              <p className="text-muted-foreground">
                {factory.branchList.length} marcas • {factory.paymentType.length} condiciones
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate(`/factories/${factory.name}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button variant="destructive" onClick={() => {
                if (confirm(`¿Eliminar fábrica "${factory.name}"?`)) {
                  deleteFactory.mutate(factory.name);
                  navigate("/factories");
                }
              }}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </div>
          </div>

          {/* Main Info Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Marcas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{factory.branchList.length}</p>
                <p className="text-sm text-muted-foreground">Marcas configuradas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Comisión base</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{factory.defaultCommission}%</p>
                <p className="text-sm text-muted-foreground">Porcentaje base</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Comisiones segmento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{Object.keys(factory.segmentCommissions).length}</p>
                <p className="text-sm text-muted-foreground">Segmentos configurados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Condiciones de pago</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{factory.paymentType.length}</p>
                <p className="text-sm text-muted-foreground">Condiciones activas</p>
              </CardContent>
            </Card>
          </div>

          {/* Brands */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Marcas ({factory.branchList.length})</CardTitle>
              <Badge variant="secondary">{factory.branchList.length}</Badge>
            </CardHeader>
            <CardContent>
              {factory.branchList.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Sin marcas configuradas</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {factory.branchList.map((brand, i) => (
                    <Badge key={i} variant="outline" className="gap-1">
                      <Package className="h-3 w-3" />
                      {brand}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Segment Commissions */}
          {Object.keys(factory.segmentCommissions).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Comisiones por segmento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-4">Segmento</th>
                        <th className="pb-2 pr-4 text-right">Comisión</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {Object.entries(factory.segmentCommissions).map(([segment, commission]) => (
                        <tr key={segment} className="border-b last:border-0">
                          <td className="py-2 pr-4">{segment}</td>
                          <td className="py-2 pr-4 text-right font-medium">{commission}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Conditions */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Condiciones de pago ({paymentConditions?.length ?? 0})</CardTitle>
              <Button variant="outline" size="sm" onClick={() => {
                // TODO: Open payment conditions modal
                console.log("Add payment condition");
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent>
              {paymentConditions && paymentConditions.length > 0 ? (
                <div className="space-y-4">
                  {paymentConditions.map((pc, i) => (
                    <div key={i} className="p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{pc.paymentName}</h4>
                        <Badge variant="secondary">{pc.discount}% dto.</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Meses:</span> {pc.month}
                        </div>
                        <div>
                          <span className="font-medium">Vencimiento:</span> {pc.expiration} días
                        </div>
                        <div>
                          <span className="font-medium">Plazo:</span> {pc.date} días
                        </div>
                        <div>
                          <span className="font-medium">Pagos:</span> {pc.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Sin condiciones de pago configuradas</p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingFactory(factory)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar fábrica
            </Button>
            <Button variant="outline" onClick={() => {
              // TODO: Open payment conditions modal
              console.log("Manage payment conditions");
            }}>
              Gestionar condiciones
            </Button>
          </div>
        </div>

        {/* Edit Factory Dialog */}
        {editingFactory && (
          <FactoryForm
            factory={editingFactory}
            onSuccess={() => setEditingFactory(null)}
            onCancel={() => setEditingFactory(null)}
          />
        )}

    </main>
  );
}