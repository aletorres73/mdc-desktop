import React from "react";
import { Card } from "@/presentation/components/ui/card";
import { cn } from "@/lib/utils";

interface DataTableShellProps {
  headers: React.ReactNode[];
  children: React.ReactNode;
  className?: string;
}

export function DataTableShell({ headers, children, className }: DataTableShellProps) {
  return (
    <Card className={cn("border-border/50 shadow-sm bg-card overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b border-border/50">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {children}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function DataTableRow({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "hover:bg-muted/20 transition-colors",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function DataTableCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}
