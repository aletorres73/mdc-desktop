"use client";

import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClients, useCreateClient, useDeleteClient } from "../hooks/useClients";
import { PageShell, PageHeader, DataTableShell, DataTableRow, DataTableCell, DataState } from "../components/shared";
import { Input } from "@/presentation/components/ui/input";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/presentation/components/ui/dialog";
import { Label } from "@/presentation/components/ui/label";
import { Search, Plus, Trash2, Loader2, Users } from "lucide-react";
import type { ClientFilters } from "@/domain/entities/client";
import { clientDetailRoute } from "../routes/routes";

export default function Clients() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ClientFilters>({ search: "" });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newClientId, setNewClientId] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useClients(filters);
  const createClient = useCreateClient();
  const deleteClient = useDeleteClient();

  const clients = data?.pages.flatMap((page) => page.items) ?? [];

  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, []);

  const handleCreate = async () => {
    if (!newClientId.trim() || !newClientName.trim()) return;
    try {
      await createClient.mutateAsync({ clientId: newClientId.trim(), clientName: newClientName.trim() });
      setNewClientId("");
      setNewClientName("");
      setIsCreateDialogOpen(false);
    } catch (err) {
      console.error("Error creating client:", err);
    }
  };

  const handleDelete = async (clientId: string) => {
    try {
      await deleteClient.mutateAsync(clientId);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Error deleting client:", err);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Clientes"
        description="Gestión de clientes y cartera comercial"
        icon={Users}
        actions={
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger
              render={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo cliente
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear cliente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="clientId">ID del cliente</Label>
                  <Input
                    id="clientId"
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                    placeholder="ID único"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="clientName">Razón Social</Label>
                  <Input
                    id="clientName"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Nombre del cliente"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={createClient.isPending || !newClientId.trim() || !newClientName.trim()}>
                  {createClient.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="border-border/50 shadow-sm bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Buscar clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por razón social..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <DataState
        isLoading={isLoading}
        error={error}
        isEmpty={clients.length === 0}
        emptyTitle="No se encontraron clientes"
        emptyDescription="Prueba con otra búsqueda o crea un nuevo cliente."
      >
        <DataTableShell headers={["ID", "Razón Social", "Acciones"]}>
          {clients.map((client) => (
            <DataTableRow
              key={client.clientId}
              onClick={() => navigate(clientDetailRoute(client.clientId))}
            >
              <DataTableCell className="font-mono text-sm">{client.clientId}</DataTableCell>
              <DataTableCell>
                <Link className="font-medium hover:underline" to={clientDetailRoute(client.clientId)}>
                  {client.clientName}
                </Link>
              </DataTableCell>
              <DataTableCell className="w-24 text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmId(client.clientId);
                  }}
                  disabled={deleteClient.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableShell>

        {hasNextPage && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full max-w-xs"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando más...
                </>
              ) : (
                "Cargar más clientes"
              )}
            </Button>
          </div>
        )}
      </DataState>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar cliente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que querés eliminar este cliente? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleteClient.isPending}
            >
              {deleteClient.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
