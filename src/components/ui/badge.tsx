import type { HTMLAttributes } from "react";

const badgeVariants: Record<
  "default" | "destructive" | "success" | "warning",
  string
> = {
  default: "bg-slate-100 text-slate-700",
  destructive: "bg-red-100 text-red-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-orange-100 text-orange-700",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "destructive" | "success" | "warning";
}

export function Badge({
  variant = "default",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badgeVariants[variant]} ${className}`}
      {...props}
    />
  );
}
