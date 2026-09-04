import * as React from "react";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { cn } from "@/lib/utils";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <BaseTooltip.Provider delay={200}>{children}</BaseTooltip.Provider>;
}

export const Tooltip = BaseTooltip.Root;
export const TooltipTrigger = BaseTooltip.Trigger;

export function TooltipContent({ className, ...props }: React.ComponentProps<typeof BaseTooltip.Popup>) {
  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner sideOffset={6}>
        <BaseTooltip.Popup
          className={cn(
            "z-50 rounded-md border border-border/50 bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md",
            className,
          )}
          {...props}
        />
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  );
}
