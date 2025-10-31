import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary";
};

export function Button({ className = "", variant = "default", ...props }: ButtonProps) {
  const base = "inline-flex items-center px-3 py-2 rounded-md text-sm border transition";
  const styles =
    variant === "secondary"
      ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-900"
      : "bg-blue-600 hover:bg-blue-700 border-blue-700 text-white";
  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
