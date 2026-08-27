import React from "react";
import { cn } from "@/lib/utils";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "default" | "full" | "narrow";
}

export function PageShell({ children, className, maxWidth = "default" }: PageShellProps) {
  const maxWidthClass =
    maxWidth === "full"
      ? "max-w-none"
      : maxWidth === "narrow"
      ? "max-w-5xl"
      : "max-w-7xl";

  return (
    <div className="min-h-svh w-full min-w-0 bg-muted/30 p-4 sm:p-6">
      <div className={cn("mx-auto w-full space-y-6", maxWidthClass, className)}>
        {children}
      </div>
    </div>
  );
}
