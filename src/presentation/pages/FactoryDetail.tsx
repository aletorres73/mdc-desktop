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
import { ArrowLeft, Plus, Save, Trash2, X } from "lucide-react";

const emptyCondition: PaymentCondition = { paymentName: "", discount: 0, month: 0, expiration: 0, date: 0, quantity: 1 };

export default function FactoryDetail() {
  const { factoryName } = useParams<{ factoryName: string }>();
  const decodedName = factoryName ? decodeURIComponent(factoryName) : "";
  const navigate = useNavigate();
  const { appUser } = useAuth();
  const { data: factory, isLoading } = useFactory(appUser?.uid, decodedName);
  const updateFactory = useUpdateFactory(appUser?.uid);
  const deleteFactory = useDeleteFactory(appUser?.uid);

  const [segments, setSegments] = useState<string[]>([]);
  const [newSegment, setNewSegment] = useState("");
  const [defaultCommission, setDefaultCommission] = useState("0");
  const [segmentCommissions, setSegmentCommissions] = useState<Record<string, number>>({});
  const [conditions, setConditions] = useState<PaymentCondition[]>([]);

  useEffect(() => {
    if (factory) {
      setSegments(factory.branchList);
      setDefaultCommission(String(factory.defaultCommission * 100));
      setSegmentCommissions(
        Object.fromEntries(
          Object.entries(factory.segmentCommissions ?? {}).map(([segment, commission]) => [segment, commission * 100]),
        ),
      );
      setConditions(factory.paymentType);
    }
  }, [factory]);

  if (isLoading) return <LoadingState className="min-h-[60vh]" />;
  if (!factory) return <p className="text-muted-foreground">Fábrica no encontrada.</p>;

  const addSegment = () => {
    const segment = newSegment.trim();
    if (!segment || segments.includes(segment)) return;

    setSegments((prev) => [...prev, segment]);
    setSegmentCommissions((prev) => ({ ...prev, [segment]: prev[segment] ?? 0 }));
    setNewSegment("");
  };

  const removeSegment = (segmentToRemove: string) => {
    setSegments((prev) => prev.filter((segment) => segment !== segmentToRemove));
    setSegmentCommissions((prev) => {
      const next = { ...prev };
      delete next[segmentToRemove];
      return next;
    });
  };

  const handleSave = async () => {
    const nextSegmentCommissions = segments.reduce<Record<string, number>>((acc, segment) => {
      acc[segment] = segmentCommissions[segment] ?? 0;
      return acc;
    }, {});

    await updateFactory.mutateAsync({
      name: decodedName,
      data: {
        branchList: segments,
        defaultCommission: (parseFloat(defaultCommission) || 0) / 100,
        segmentCommissions: Object.fromEntries(
          Object.entries(nextSegmentCommissions).map(([segment, commission]) => [segment, commission / 100]),
        ),
        paymentType: conditions,
      },
    });
  };

  const handleDelete = async () => {
    await deleteFactory.mutateAsync(decodedName);
    navigate(ROUTES.FACTORIES);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
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
        <CardContent className="grid gap-4 md:grid-cols-[1.5fr_0.8fr]">
          <div className="space-y-2">
            <Label>Segmentos</Label>
            <div className="flex gap-2">
              <Input
                value={newSegment}
                placeholder="Ej. Farmacia"
                onChange={(e) => setNewSegment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSegment();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addSegment} disabled={!newSegment.trim()}>
                <Plus className="h-4 w-4" /> Agregar
              </Button>
            </div>
            {segments.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {segments.map((segment) => (
                  <span key={segment} className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/30 py-1 pl-3 pr-1 text-sm">
                    {segment}
                    <button
                      type="button"
                      aria-label={`Quitar segmento ${segment}`}
                      className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => removeSegment(segment)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Agrega al menos un segmento para configurar sus comisiones.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Comisión global</Label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={defaultCommission}
                onChange={(e) => setDefaultCommission(e.target.value)}
                className="pr-8"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Comisiones por segmento</CardTitle>
        </CardHeader>
        <CardContent>
          {segments.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Comisión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {segments.map((segment) => (
                  <TableRow key={segment}>
                    <TableCell className="font-medium">{segment}</TableCell>
                    <TableCell>
                      <div className="max-w-[160px]">
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={segmentCommissions[segment] ?? 0}
                            onChange={(e) =>
                              setSegmentCommissions((prev) => ({
                                ...prev,
                                [segment]: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className="pr-8"
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">%</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Sin segmentos para configurar.</p>
          )}
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

      <div className="flex flex-col gap-2">
        <Button onClick={handleSave} disabled={updateFactory.isPending}>
          <Save className="h-4 w-4" /> {updateFactory.isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
        {updateFactory.isSuccess && <p className="text-center text-sm text-emerald-600">Cambios guardados correctamente.</p>}
        {updateFactory.isError && (
          <p className="text-center text-sm text-destructive">
            No se pudieron guardar los cambios. {updateFactory.error instanceof Error ? updateFactory.error.message : "Revisa tu conexión."}
          </p>
        )}
      </div>
    </div>
  );
}
