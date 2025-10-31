import * as React from "react";

interface BadgeProps {
  children: React.ReactNode;
  toneClassName?: string;
}

export function Badge({ children, toneClassName = "" }: BadgeProps) {
  return <span className={`px-2 py-1 text-xs rounded-full ${toneClassName}`}>{children}</span>;
}
