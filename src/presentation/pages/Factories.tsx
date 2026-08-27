"use client";

import { useState } from "react";
import { useFactories, useDeleteFactory } from "../hooks/useFactories";
import type { FactoryModel } from "@/domain/entities/factory";
import { PageShell, PageHeader, DataTableShell, DataTableRow, DataTableCell, DataState } from "../components/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Trash2, Edit, Factory, RefreshCw } from "lucide-react";
import { FactoryForm } from "../components/FactoryForm";

export default function Factories() {
  const [search, setSearch] = useState("");
  const [editingFactory, setEditingFactory] = useState<FactoryModel | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: factories, isLoading, error, refetch } = useFactories();
  const deleteFactory = useDeleteFactory();

  const filteredFactories = factories?.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const handleDelete = async (name: string) => {
    if (!confirm(`¿Eliminar fábrica "${name}"?`)) return;
    try {
      await deleteFactory.mutateAsync(name);
    } catch (err) {
      console.error("Error deleting factory:", err);
    }
  };

  const handleEdit = (factory: FactoryModel) => {
    setEditingFactory(factory);
  };

  const handleCreate = () => {
    setIsCreateDialogOpen(true);
  };

  const handleFormSuccess = () => {
    setEditingFactory(null);
    setIsCreateDialogOpen(false);
  };

  const handleFormCancel = () => {
    setEditingFactory(null);
    setIsCreateDialogOpen(false);
  };

  return (
    <PageShell>
      <PageHeader
        title="Fábricas"
        description="Gestión de fábricas, marcas y condiciones comerciales"
        icon={Factory}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
            </Button>
            <Button size="sm" onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" /> Nueva fábrica
            </Button>
          </div>
        }
      />

      <Card className="border-border/50 shadow-sm bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Buscar fábricas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre de fábrica..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <DataState
        isLoading={isLoading}
        error={error}
        isEmpty={filteredFactories.length === 0}
        emptyTitle="No se encontraron fábricas"
        emptyDescription="Prueba con otro término de búsqueda o crea una fábrica."
      >
        <DataTableShell headers={["Fábrica", "Marcas", "Comisión base", "Condiciones", "Acciones"]}>
          {filteredFactories.map((factory) => (
            <DataTableRow key={factory.name}>
              <DataTableCell className="font-semibold">{factory.name}</DataTableCell>
              <DataTableCell>
                <span className="text-sm font-medium">{factory.branchList.length} marcas</span>
                <div className="text-xs text-muted-foreground truncate max-w-xs">
                  {factory.branchList.join(", ") || "Sin marcas"}
                </div>
              </DataTableCell>
              <DataTableCell className="font-semibold text-primary">{factory.defaultCommission}%</DataTableCell>
              <DataTableCell className="text-muted-foreground text-sm">{factory.paymentType.length} condiciones</DataTableCell>
              <DataTableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(factory)}
                    title="Editar"
                  >
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(factory.name)}
                    disabled={deleteFactory.isPending}
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableShell>
      </DataState>

      {isCreateDialogOpen && (
        <FactoryForm
          factory={null}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      {editingFactory && (
        <FactoryForm
          factory={editingFactory}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}
    </PageShell>
  );
}
