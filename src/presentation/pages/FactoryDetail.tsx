"use client";

import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useFactory, useFactoryPaymentConditions, useDeleteFactory } from "../hooks/useFactories";
import { PageShell, PageHeader, KpiCard, DataTableShell, DataTableRow, DataTableCell } from "../components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Factory, Package, AlertCircle, Trash2, Edit, CreditCard, Layers } from "lucide-react";
import { FactoryForm } from "../components/FactoryForm";
import type { FactoryModel } from "@/domain/entities/factory";
import { ROUTES } from "../routes/routes";

export default function FactoryDetail() {
  const { factoryName } = useParams<{ factoryName: string }>();
  const navigate = useNavigate();
  const { data: factory, isLoading, error } = useFactory(factoryName ?? null);
  const { data: paymentConditions } = useFactoryPaymentConditions(factoryName ?? null);
  const deleteFactory = useDeleteFactory();
  const [editingFactory, setEditingFactory] = useState<FactoryModel | null>(null);

  if (isLoading) {
    return (
      <PageShell>
        <div className="space-y-6">
          <Skeleton className="h-16 w-1/3 rounded-xl" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </div>
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </PageShell>
    );
  }

  if (error || !factory) {
    return (
      <PageShell>
        <div className="flex min-h-[50vh] w-full items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Fábrica no encontrada</h2>
            <p className="text-muted-foreground mb-4">No se pudo cargar la fábrica {factoryName}</p>
            <Link to={ROUTES.FACTORIES}>
              <Button variant="outline">Volver al listado</Button>
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar fábrica "${factory.name}"?`)) return;
    try {
      await deleteFactory.mutateAsync(factory.name);
      navigate(ROUTES.FACTORIES);
    } catch (err) {
      console.error("Error deleting factory:", err);
    }
  };

  return (
    <PageShell maxWidth="default">
      <PageHeader
        title={factory.name}
        description={`${factory.branchList.length} marcas • ${factory.paymentType.length} condiciones de pago`}
        icon={Factory}
        actions={
          <div className="flex items-center gap-2">
            <Link to={ROUTES.FACTORIES}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setEditingFactory(factory)}>
              <Edit className="mr-2 h-4 w-4" /> Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteFactory.isPending}>
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Comisión Base" value={`${factory.defaultCommission}%`} icon={CreditCard} tone="success" />
        <KpiCard label="Marcas Registradas" value={factory.branchList.length} icon={Package} tone="info" />
        <KpiCard label="Condiciones de Pago" value={factory.paymentType.length} icon={Layers} tone="primary" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Marcas de la Fábrica</CardTitle>
          </CardHeader>
          <CardContent>
            {factory.branchList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin marcas configuradas</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {factory.branchList.map((branch) => (
                  <span
                    key={branch}
                    className="inline-flex items-center px-3 py-1 rounded-md bg-muted text-sm font-medium border border-border/40"
                  >
                    {branch}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Comisiones por Segmento</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(factory.segmentCommissions || {}).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin comisiones por segmento</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(factory.segmentCommissions).map(([segment, rate]) => (
                  <div key={segment} className="flex justify-between items-center p-2 rounded border border-border/40 bg-muted/20">
                    <span className="text-sm font-medium">{segment}</span>
                    <span className="text-sm font-semibold text-primary">{rate}%</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Condiciones de Pago Configuradas ({paymentConditions?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(!paymentConditions || paymentConditions.length === 0) ? (
            <p className="text-muted-foreground text-center py-6">Sin condiciones de pago</p>
          ) : (
            <DataTableShell headers={["Condición", "Descuento", "Meses", "Vencimiento (días)", "Plazo (días)", "Cantidad Pagos"]}>
              {paymentConditions.map((pc, i) => (
                <DataTableRow key={i}>
                  <DataTableCell className="font-semibold">{pc.paymentName}</DataTableCell>
                  <DataTableCell>{pc.discount}%</DataTableCell>
                  <DataTableCell>{pc.month}</DataTableCell>
                  <DataTableCell>{pc.expiration}</DataTableCell>
                  <DataTableCell>{pc.date}</DataTableCell>
                  <DataTableCell>{pc.quantity}</DataTableCell>
                </DataTableRow>
              ))}
            </DataTableShell>
          )}
        </CardContent>
      </Card>

      {editingFactory && (
        <FactoryForm
          factory={editingFactory}
          onSuccess={() => setEditingFactory(null)}
          onCancel={() => setEditingFactory(null)}
        />
      )}
    </PageShell>
  );
}
