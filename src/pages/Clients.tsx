"use client";

import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClients, useCreateClient, useDeleteClient } from "@/hooks";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Trash2, Loader2 } from "lucide-react";
import type { ClientFilters } from "@/types/domain";
import { clientDetailRoute } from "@/types/routes";

/**
 * Clients page — mirrors Kotlin ClientsScreen / ClientsViewModel
 * Features: search, pagination, create/delete dialogs
 */
export default function Clients() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ClientFilters>({ search: "" });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useClients(filters);
  const createClient = useCreateClient();
  const deleteClient = useDeleteClient();

  // Flatten all pages
  const clients = data?.pages.flatMap((page) => page.items) ?? [];

  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, []);

  const handleCreate = async () => {
    if (!newClientName.trim()) return;
    try {
      await createClient.mutateAsync({ clientName: newClientName.trim() });
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
    <main className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Clientes</h1>
              <p className="text-muted-foreground">
                Gestión de clientes
              </p>
            </div>
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
                    <Label htmlFor="clientName">Razón Social</Label>
                    <Input
                      id="clientName"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Nombre del cliente"
                      autoFocus
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} disabled={createClient.isPending || !newClientName.trim()}>
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
          </header>

          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Buscar clientes</CardTitle>
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

          {/* Clients Table */}
          <Card>
            <CardHeader>
              <CardTitle>Listado de clientes ({clients.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Razón Social</TableHead>
                      <TableHead className="w-24">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : error ? (
                <div className="text-center py-8 text-destructive">
                  Error al cargar clientes: {error.message}
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron clientes
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Razón Social</TableHead>
                          <TableHead className="w-24">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clients.map((client) => (
                          <TableRow key={client.clientId} className="cursor-pointer" onClick={() => navigate(clientDetailRoute(client.clientId))}>
                            <TableCell className="font-mono text-sm">{client.clientId}</TableCell>
                            <TableCell>
                              <Link className="font-medium hover:underline" to={clientDetailRoute(client.clientId)}>
                                {client.clientName}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(event) => { event.stopPropagation(); setDeleteConfirmId(client.clientId); }}
                                disabled={deleteClient.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Load More */}
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
                          <>
                            Cargar más clientes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Delete Confirmation Dialog */}
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
        </div>
    </main>
  );
}