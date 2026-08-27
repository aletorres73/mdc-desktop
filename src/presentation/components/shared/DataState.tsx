import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataStateProps {
  isLoading?: boolean;
  error?: Error | null | string;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  skeletonCount?: number;
  skeletonHeight?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function DataState({
  isLoading,
  error,
  isEmpty,
  emptyTitle = "No hay datos para mostrar",
  emptyDescription,
  skeletonCount = 3,
  skeletonHeight = "h-24",
  onRetry,
  children,
}: DataStateProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 w-full">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} className={`${skeletonHeight} w-full rounded-lg`} />
        ))}
      </div>
    );
  }

  if (error) {
    const message = typeof error === "string" ? error : error.message;
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error al cargar datos</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4 mt-1">
          <span>{message}</span>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Reintentar
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (isEmpty) {
    return (
      <Card className="border-border/50 shadow-sm bg-card">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-3">
          <div className="p-3 bg-muted rounded-full">
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-semibold">{emptyTitle}</p>
          {emptyDescription && (
            <p className="text-sm text-muted-foreground max-w-sm">{emptyDescription}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
