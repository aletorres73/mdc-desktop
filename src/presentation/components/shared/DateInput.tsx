import { useEffect, useState } from "react";
import { Input } from "@/presentation/components/ui/input";
import { CalendarDays } from "lucide-react";

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  className?: string;
}

function toDisplay(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

function toIso(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;

  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return null;

  return `${year}-${month}-${day}`;
}

export function DateInput({ value, onChange, min, max, className }: DateInputProps) {
  const [draft, setDraft] = useState(() => toDisplay(value));

  useEffect(() => {
    const displayValue = toDisplay(value);
    if (toIso(draft) !== value) setDraft(displayValue);
  }, [value]);

  return (
    <div className="relative">
      <Input
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        value={draft}
        className={`pr-10 ${className ?? ""}`}
        onChange={(event) => {
          const next = event.target.value.replace(/[^\d/]/g, "").slice(0, 10);
          setDraft(next);
          if (!next) onChange("");
          const iso = toIso(next);
          if (iso) onChange(iso);
        }}
        onBlur={() => {
          if (draft && !toIso(draft)) setDraft(toDisplay(value));
        }}
      />
      <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="date"
        aria-label="Seleccionar fecha"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="absolute right-0 top-0 h-9 w-10 cursor-pointer opacity-0"
      />
    </div>
  );
}