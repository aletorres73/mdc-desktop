import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { useFactory, useUpdateFactory, useDeleteFactory } from "@/presentation/hooks/useFactories";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { ROUTES } from "@/presentation/routes/routes";
import type { PaymentCondition } from "@/domain/entities/factory";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";

const emptyCondition: PaymentCondition = { paymentName: "", discount: 0, month: 0, expiration: 0, date: 0, quantity: 1 };

export default function FactoryDetail() {
  const { factoryName } = useParams<{ factoryName: string }>();
  const decodedName = factoryName ? decodeURIComponent(factoryName) : "";
  const navigate = useNavigate();
  const { appUser } = useAuth();
  const { data: factory, isLoading } = useFactory(appUser?.uid, decodedName);
  const updateFactory = useUpdateFactory(appUser?.uid);
  const deleteFactory = useDeleteFactory(appUser?.uid);

  const [branchList, setBranchList] = useState("");
  const [defaultCommission, setDefaultCommission] = useState("0");
  const [conditions, setConditions] = useState<PaymentCondition[]>([]);

  useEffect(() => {
    if (factory) {
      setBranchList(factory.branchList.join(", "));
      setDefaultCommission(String(factory.defaultCommission));
      setConditions(factory.paymentType);
    }
  }, [factory]);

  if (isLoading) return <LoadingState className="min-h-[60vh]" />;
  if (!factory) return <p className="text-muted-foreground">Fábrica no encontrada.</p>;

  const handleSave = async () => {
    await updateFactory.mutateAsync({
      name: decodedName,
      data: {
        branchList: branchList.split(",").map((b) => b.trim()).filter(Boolean),
        defaultCommission: parseFloat(defaultCommission) || 0,
        paymentType: conditions,
      },
    });
  };

  const handleDelete = async () => {
    await deleteFactory.mutateAsync(decodedName);
    navigate(ROUTES.FACTORIES);
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to={ROUTES.FACTORIES} className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Fábricas
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{decodedName}</h1>
        </div>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" /> Eliminar
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Configuración</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label>Marcas (separadas por coma)</Label>
            <Input value={branchList} onChange={(e) => setBranchList(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Comisión base (0-1)</Label>
            <Input type="number" step="0.01" value={defaultCommission} onChange={(e) => setDefaultCommission(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Condiciones de pago</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setConditions((prev) => [...prev, { ...emptyCondition }])}>
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Vencimiento (días)</TableHead>
                <TableHead>Descuento</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {conditions.map((c, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Input
                      value={c.paymentName}
                      onChange={(e) =>
                        setConditions((prev) => prev.map((p, i) => (i === idx ? { ...p, paymentName: e.target.value } : p)))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={c.expiration}
                      onChange={(e) =>
                        setConditions((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, expiration: parseFloat(e.target.value) || 0 } : p)),
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={c.discount}
                      onChange={(e) =>
                        setConditions((prev) => prev.map((p, i) => (i === idx ? { ...p, discount: parseFloat(e.target.value) || 0 } : p)))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setConditions((prev) => prev.filter((_, i) => i !== idx))}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={updateFactory.isPending}>
        <Save className="h-4 w-4" /> Guardar cambios
      </Button>
    </div>
  );
}
