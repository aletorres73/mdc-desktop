import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { useClients, useCreateClient, useDeleteClient, useSuggestedClientId } from "@/presentation/hooks/useClients";
import { Input } from "@/presentation/components/ui/input";
import { Button } from "@/presentation/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { EmptyState } from "@/presentation/components/shared/EmptyState";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/presentation/components/ui/dialog";
import { Label } from "@/presentation/components/ui/label";
import { clientDetailPath } from "@/presentation/routes/routes";
import { Search, UserPlus, Users, Trash2 } from "lucide-react";

export default function Clients() {
  const { appUser } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const [newClientName, setNewClientName] = useState("");
  const [newClientId, setNewClientId] = useState("");
  const [open, setOpen] = useState(false);

  const { data: clients, isLoading } = useClients(appUser?.uid, search);
  const createClient = useCreateClient(appUser?.uid);
  const deleteClient = useDeleteClient(appUser?.uid);
  const { data: suggestedId } = useSuggestedClientId(appUser?.uid, open);

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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por razón social..."
          className="pl-9"
          value={search}
          onChange={(e) => updateSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : !clients?.length ? (
        <EmptyState icon={Users} title="Sin clientes" description="Creá el primer cliente para empezar." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente ID</TableHead>
              <TableHead>Razón social</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
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
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    loading={deleteClient.isPending && deleteClient.variables === client.clientId}
                    disabled={deleteClient.isPending}
                    onClick={() => deleteClient.mutate(client.clientId)}
                    aria-label="Eliminar cliente"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
