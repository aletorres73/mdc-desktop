import { useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { useInvoicesPage } from "@/presentation/hooks/useInvoices";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Badge, stateToBadgeVariant } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { EmptyState } from "@/presentation/components/shared/EmptyState";
import { formatMoney, formatDate } from "@/lib/utils";
import { invoiceDetailPath } from "@/presentation/routes/routes";
import { AlertTriangle, CalendarClock, ChevronLeft, ChevronRight, Info, X } from "lucide-react";

// Helper functions for date calculations aligned with AgendaViewModel.kt
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function addDays(d: Date, days: number): Date {
  const res = new Date(d);
  res.setDate(res.getDate() + days);
  return res;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isSameDayTimestamp(epochMs: number, d2: Date): boolean {
  if (!epochMs) return false;
  const d1 = new Date(epochMs);
  return isSameDay(d1, d2);
}

function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const f1 = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(monday);
  const f2 = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(sunday);
  return `${f1} - ${f2}`;
}

function formatDateTitle(d: Date): string {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long" }).format(d);
}

function getDayNameShort(d: Date): string {
  return new Intl.DateTimeFormat("es-AR", { weekday: "short" }).format(d).toUpperCase().replace(".", "");
}

function getIndicatorColorClass(state: string): string {
  const normalized = state.toLowerCase();
  if (normalized.includes("vencido")) return "bg-red-500";
  if (normalized.includes("por vencer")) return "bg-amber-500";
  if (normalized.includes("pendiente")) return "bg-orange-500";
  if (normalized.includes("cobrado") || normalized.includes("imputado")) return "bg-emerald-500";
  return "bg-slate-400";
}

// yyyy-MM-dd, local time to avoid timezone shifting the selected day
function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateParam(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Agenda() {
  const location = useLocation();
  const { appUser } = useAuth();
  const { data: page, isLoading } = useInvoicesPage(appUser?.uid, {}, 200);
  const [searchParams, setSearchParams] = useSearchParams();

  const initialDate = parseDateParam(searchParams.get("date")) ?? new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMonday(initialDate));
  const [isFilteringUrgent, setIsFilteringUrgent] = useState(searchParams.get("urgent") === "1");

  const allBillings = page?.items ?? [];

  // Total count of urgent or overdue billings
  const urgentBillingsCount = useMemo(() => {
    return allBillings.filter(
      (b) => b.rest > 0 && (b.stateBilling === "Vencido" || b.stateBilling === "Por vencer")
    ).length;
  }, [allBillings]);

  // Non-overdue pending billings (al día / a vencer)
  const { nonOverdueCount, nonOverdueTotal } = useMemo(() => {
    const nonOverdue = allBillings.filter(
      (b) => b.rest > 0 && b.stateBilling !== "Vencido"
    );
    const total = nonOverdue.reduce((acc, b) => acc + b.rest, 0);
    return { nonOverdueCount: nonOverdue.length, nonOverdueTotal: total };
  }, [allBillings]);

  // 7 days of the selected week with status indicator dots
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(currentWeekStart, i);
      const states = Array.from(
        new Set(
          allBillings
            .filter((b) => b.payDate && isSameDayTimestamp(b.payDate, date) && b.rest > 0)
            .map((b) => b.stateBilling)
        )
      );
      const indicators = states.map((st) => getIndicatorColorClass(st));
      return { date, indicators };
    });
  }, [allBillings, currentWeekStart]);

  // Filtered billings depending on urgent filter or selected date
  const items = useMemo(() => {
    if (isFilteringUrgent) {
      return allBillings
        .filter((b) => b.rest > 0 && (b.stateBilling === "Vencido" || b.stateBilling === "Por vencer"))
        .sort((a, b) => a.payDate - b.payDate);
    }
    return allBillings.filter((b) => b.payDate && isSameDayTimestamp(b.payDate, selectedDate));
  }, [allBillings, isFilteringUrgent, selectedDate]);

  const onDateSelected = (date: Date) => {
    setIsFilteringUrgent(false);
    setSelectedDate(date);
    const next = new URLSearchParams(searchParams);
    next.set("date", formatDateParam(date));
    next.delete("urgent");
    setSearchParams(next, { replace: true });
  };

  const nextWeek = () => {
    const next = addDays(currentWeekStart, 7);
    setCurrentWeekStart(next);
    setSelectedDate(next);
    const params = new URLSearchParams(searchParams);
    params.set("date", formatDateParam(next));
    setSearchParams(params, { replace: true });
  };

  const previousWeek = () => {
    const prev = addDays(currentWeekStart, -7);
    setCurrentWeekStart(prev);
    setSelectedDate(prev);
    const params = new URLSearchParams(searchParams);
    params.set("date", formatDateParam(prev));
    setSearchParams(params, { replace: true });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentWeekStart(getMonday(today));
    setSelectedDate(today);
    setIsFilteringUrgent(false);
    const params = new URLSearchParams(searchParams);
    params.set("date", formatDateParam(today));
    params.delete("urgent");
    setSearchParams(params, { replace: true });
  };

  const toggleUrgentFilter = () => {
    setIsFilteringUrgent((prev) => {
      const next = !prev;
      const params = new URLSearchParams(searchParams);
      if (next) params.set("urgent", "1");
      else params.delete("urgent");
      setSearchParams(params, { replace: true });
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agenda de vencimientos</h1>
        <p className="text-sm text-muted-foreground">Calendario de cobros y vencimientos por fecha.</p>
      </div>

      {/* Calendario Semanal por encima de la lista */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={previousWeek} title="Semana anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-base font-semibold">
                {formatWeekRange(currentWeekStart)}
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextWeek} title="Semana siguiente">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Ir a hoy
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="grid grid-cols-7 gap-2 w-full text-center">
            {weekDays.map(({ date, indicators }) => {
              const selected = isSameDay(date, selectedDate) && !isFilteringUrgent;
              const isToday = isSameDay(date, new Date());
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => onDateSelected(date)}
                  className={`flex flex-col items-center py-2.5 px-2 rounded-lg transition-colors text-xs font-medium relative border ${
                    selected
                      ? "bg-primary text-primary-foreground font-bold shadow-sm border-primary"
                      : isToday
                      ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                      : "bg-card border-border/40 hover:bg-muted text-foreground"
                  }`}
                >
                  <span className="text-[11px] opacity-80">{getDayNameShort(date)}</span>
                  <span className="text-base font-bold mt-0.5">{date.getDate()}</span>
                  <div className="flex gap-1 h-1.5 items-center justify-center mt-1.5">
                    {indicators.length > 0 ? (
                      indicators.slice(0, 3).map((colorClass, idx) => (
                        <span key={idx} className={`w-2 h-2 rounded-full ${colorClass}`} />
                      ))
                    ) : (
                      <span className="w-2 h-2 rounded-full opacity-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Banner de Señales / Avisos de Vencimientos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {urgentBillingsCount > 0 && (
          <Card
            onClick={toggleUrgentFilter}
            className={`cursor-pointer transition-all border ${
              isFilteringUrgent
                ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/15"
                : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400 hover:bg-red-500/15"
            }`}
          >
            <CardContent className="p-4 flex items-start gap-3">
              {isFilteringUrgent ? (
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs font-medium leading-relaxed">
                {isFilteringUrgent ? (
                  <span>Viendo todos los vencimientos urgentes ({urgentBillingsCount})</span>
                ) : (
                  <span>
                    Atención: Tienes <strong className="font-bold">{urgentBillingsCount}</strong> vencimiento(s)
                    urgente(s) o atrasado(s). Haz clic para filtrarlos.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {nonOverdueCount > 0 && (
          <Card className="bg-sky-500/10 border-sky-500/30 text-sky-800 dark:text-sky-300">
            <CardContent className="p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              <div className="text-xs font-medium leading-relaxed">
                <span>
                  Información: Tienes <strong className="font-bold">{nonOverdueCount}</strong> factura(s) al día / no vencida(s) con un saldo a cobrar de <strong className="font-bold">{formatMoney(nonOverdueTotal)}</strong>.
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lista de Vencimientos debajo del calendario */}
      <Card className="w-full">
        <CardHeader className="p-4 border-b border-border/50 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-primary">
            {isFilteringUrgent
              ? "Todos los Vencimientos Urgentes"
              : `Vencimientos del ${formatDateTitle(selectedDate)}`}
          </CardTitle>
          {isFilteringUrgent && (
            <Button variant="ghost" size="sm" onClick={toggleUrgentFilter} className="text-xs gap-1 text-destructive hover:text-destructive">
              <X className="h-3.5 w-3.5" /> Cerrar
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingState />
            </div>
          ) : !items.length ? (
            <div className="p-6">
              <EmptyState
                icon={CalendarClock}
                title="Sin vencimientos"
                description={
                  isFilteringUrgent
                    ? "No hay vencimientos urgentes."
                    : "No hay vencimientos para esta fecha."
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Factura / Marca</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatDate(invoice.payDate)}
                    </TableCell>
                    <TableCell className="font-medium max-w-[180px] truncate">
                      {invoice.clientName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          to={invoiceDetailPath(invoice.id!)}
                          state={{ backToPath: location.pathname + location.search }}
                          className="font-medium hover:underline text-primary"
                        >
                          {invoice.billingNumber}
                        </Link>
                        <span className="text-xs text-muted-foreground">({invoice.brand})</span>
                        <Badge variant="muted" className="text-[10px] px-1.5 py-0 font-normal">
                          {invoice.type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatMoney(invoice.rest)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={stateToBadgeVariant(invoice.stateBilling)}>
                        {invoice.stateBilling}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        to={invoiceDetailPath(invoice.id!)}
                        state={{ backToPath: location.pathname + location.search }}
                        className="inline-flex items-center justify-center rounded-md text-xs font-medium h-8 px-2.5 hover:bg-muted/50 text-foreground transition-colors"
                      >
                        Ver
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
