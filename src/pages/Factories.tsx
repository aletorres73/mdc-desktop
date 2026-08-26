"use client";

import { useState } from "react";
import { useFactories, useDeleteFactory } from "@/hooks";
import type { FactoryModel } from "@/types/domain";
import { AppSidebar } from "@/components/AppSidebar";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Trash2, Edit, Factory } from "lucide-react";
import { FactoryForm } from "@/components/FactoryForm";

/**
 * Factories page — mirrors Kotlin FactoryScreen / FactoryViewModel
 * Features: list, search, create/edit/delete, payment conditions
 */
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
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      <main className="flex-1 min-w-0 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Factory className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Fábricas</h1>
                <p className="text-muted-foreground">
                  Gestión de fábricas y marcas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => refetch()}>
                Actualizar
              </Button>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva fábrica
              </Button>
            </div>
          </header>

          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Buscar fábricas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Factories Table */}
          <Card>
            <CardHeader>
              <CardTitle>Listado de fábricas ({filteredFactories.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fábrica</TableHead>
                      <TableHead>Marcas</TableHead>
                      <TableHead>Comisión base</TableHead>
                      <TableHead>Condiciones</TableHead>
                      <TableHead className="w-24">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : error ? (
                <div className="text-center py-8 text-destructive">
                  Error al cargar fábricas: {error.message}
                </div>
              ) : filteredFactories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron fábricas
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fábrica</TableHead>
                        <TableHead>Marcas</TableHead>
                        <TableHead>Comisión base</TableHead>
                        <TableHead>Condiciones</TableHead>
                        <TableHead className="w-24">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFactories.map((factory) => (
                        <TableRow key={factory.name} className="hover:bg-accent/50">
                          <TableCell className="font-medium">{factory.name}</TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {factory.branchList.length} marcas
                            </span>
                            <div className="text-xs text-muted-foreground truncate max-w-xs">
                              {factory.branchList.join(", ")}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {factory.defaultCommission}%
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {factory.paymentType.length} condiciones
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(factory)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create Factory Dialog */}
        {isCreateDialogOpen && (
          <FactoryForm
            factory={null}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        )}

        {/* Edit Factory Dialog */}
        {editingFactory && (
          <FactoryForm
            factory={editingFactory}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        )}

      </main>
    </div>
  );
}