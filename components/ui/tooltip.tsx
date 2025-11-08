import React, { ReactNode } from "react";

export function TooltipProvider({
  children,
  delayDuration, // eslint-disable-line @typescript-eslint/no-unused-vars
}: {
  children: ReactNode;
  delayDuration?: number;
}) {
  return <>{children}</>;
}

/** Container shim */
export function Tooltip({
  children,
  open, defaultOpen, onOpenChange,
}: {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return <>{children}</>;
}

export function TooltipTrigger({
  asChild,
  children,
  className,
  ...rest
}: {
  asChild?: boolean;
  children: ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLElement>) {
  return asChild ? (
    <>{children}</>
  ) : (
    <span className={className} {...rest}>
      {children}
    </span>
  );
}

export function TooltipContent({
  children,
  className,
  side,         // "top" | "right" | "bottom" | "left"
  sideOffset,   // number
  ...rest
}: {
  children: ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...rest} data-tooltip-shim>
      {children}
    </div>
  );
}
