import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { useClients, useCreateClient, useDeleteClient, useSuggestedClientId, useUpdateClient } from "@/presentation/hooks/useClients";
import { Input } from "@/presentation/components/ui/input";
import { Button } from "@/presentation/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { EmptyState } from "@/presentation/components/shared/EmptyState";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/presentation/components/ui/dialog";
import { Label } from "@/presentation/components/ui/label";
import { Badge } from "@/presentation/components/ui/badge";
import { clientDetailPath } from "@/presentation/routes/routes";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, UserPlus, Users, Archive, RotateCcw } from "lucide-react";

type SortKey = "clientId" | "clientName";
type SortDir = "asc" | "desc";

const SORT_STORAGE_KEY = "clients-sort";

function loadSort(): { key: SortKey; dir: SortDir } {
  try {
    const raw = localStorage.getItem(SORT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { key?: string; dir?: string };
      if ((parsed.key === "clientId" || parsed.key === "clientName") && (parsed.dir === "asc" || parsed.dir === "desc")) {
        return { key: parsed.key, dir: parsed.dir };
      }
    }
  } catch {
    // almacenamiento no disponible
  }
  return { key: "clientId", dir: "asc" };
}

export default function Clients() {
  const { appUser } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const [newClientName, setNewClientName] = useState("");
  const [newClientId, setNewClientId] = useState("");
  const [open, setOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [{ key: sortKey, dir: sortDir }, setSort] = useState(loadSort);

  const toggleSort = (key: SortKey) => {
    setSort((prev) => {
      const next = prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" as const : "asc" as const } : { key, dir: "asc" as const };
      try {
        localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // almacenamiento no disponible
      }
      return next;
    });
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />;
    return sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />;
  };

  const { data: clients, isLoading } = useClients(appUser?.uid, search);
  const createClient = useCreateClient(appUser?.uid);
  const deleteClient = useDeleteClient(appUser?.uid);
  const updateClient = useUpdateClient(appUser?.uid);
  const { data: suggestedId } = useSuggestedClientId(appUser?.uid, open);

  const visibleClients = (clients ?? []).filter((client) => showInactive || client.isActive !== false);

  const sortedClients = [...visibleClients].sort((a, b) => {
    const cmp =
      sortKey === "clientId"
        ? String(a.clientId).localeCompare(String(b.clientId), undefined, { numeric: true })
        : a.clientName.localeCompare(b.clientName, "es", { sensitivity: "base" });
    return sortDir === "asc" ? cmp : -cmp;
  });

  const updateSearch = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value.trim()) next.set("q", value);
    else next.delete("q");
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (open && suggestedId) setNewClientId(suggestedId);
  }, [open, suggestedId]);

  const handleCreate = async () => {
    if (!newClientName.trim()) return;
    await createClient.mutateAsync({
      clientName: newClientName.trim(),
      clientId: newClientId.trim() || undefined,
    });
    setNewClientName("");
    setNewClientId("");
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">Gestión de la cartera de clientes.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button><UserPlus className="h-4 w-4" />Nuevo cliente</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="clientName">Razón social</Label>
              <Input id="clientName" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clientId">ID asignado</Label>
              <Input id="clientId" value={newClientId} readOnly={true} onChange={(e) => setNewClientId(e.target.value)} />
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} loading={createClient.isPending}>
                {createClient.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por razón social..."
            className="pl-9"
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Mostrar inactivos
        </label>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : !sortedClients.length ? (
        <EmptyState icon={Users} title="Sin clientes" description="Creá el primer cliente para empezar." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort("clientId")}
                  className="inline-flex items-center gap-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Cliente ID
                  {sortIcon("clientId")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort("clientName")}
                  className="inline-flex items-center gap-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Razón social
                  {sortIcon("clientName")}
                </button>
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedClients.map((client) => (
              <TableRow key={client.clientId}>
                <TableCell className="text-muted-foreground">{client.clientId}</TableCell>
                <TableCell>
                  <Link
                    to={clientDetailPath(client.clientId)}
                    state={{ backToSearch: location.search }}
                    className="font-medium hover:underline"
                  >
                    {client.clientName}
                  </Link>
                  {client.isActive === false && (
                    <Badge variant="muted" className="ml-2">Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {client.isActive === false ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      loading={updateClient.isPending && updateClient.variables?.clientId === client.clientId}
                      disabled={updateClient.isPending}
                      onClick={() => updateClient.mutate({ clientId: client.clientId, data: { isActive: true } })}
                      aria-label="Restaurar cliente"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      loading={deleteClient.isPending && deleteClient.variables === client.clientId}
                      disabled={deleteClient.isPending}
                      onClick={() => deleteClient.mutate(client.clientId)}
                      aria-label="Inhabilitar cliente"
                    >
                      <Archive className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
