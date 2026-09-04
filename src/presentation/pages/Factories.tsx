import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { useFactories, useCreateFactory } from "@/presentation/hooks/useFactories";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/presentation/components/ui/dialog";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { EmptyState } from "@/presentation/components/shared/EmptyState";
import { factoryDetailPath } from "@/presentation/routes/routes";
import { Factory, Plus } from "lucide-react";

export default function Factories() {
  const { appUser } = useAuth();
  const { data: factories, isLoading } = useFactories(appUser?.uid);
  const createFactory = useCreateFactory(appUser?.uid);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createFactory.mutateAsync({
      name: name.trim(),
      branchList: [],
      paymentType: [],
      defaultCommission: 0,
      segmentCommissions: {},
    });
    setName("");
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fábricas</h1>
          <p className="text-sm text-muted-foreground">Condiciones de pago y comisiones por fábrica.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button><Plus className="h-4 w-4" />Nueva fábrica</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva fábrica</DialogTitle>
            </DialogHeader>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de fábrica" />
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createFactory.isPending}>
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : !factories?.length ? (
        <EmptyState icon={Factory} title="Sin fábricas" description="Creá la primera fábrica para configurar comisiones." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fábrica</TableHead>
              <TableHead>Marcas</TableHead>
              <TableHead>Comisión base</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {factories.map((f) => (
              <TableRow key={f.name}>
                <TableCell>
                  <Link to={factoryDetailPath(f.name)} className="font-medium hover:underline">
                    {f.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{f.branchList.join(", ") || "-"}</TableCell>
                <TableCell className="tabular-nums">{(f.defaultCommission * 100).toFixed(1)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
