import type { ReactNode } from "react";

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  void open;
  void onOpenChange;
  return <>{children}</>;
}

export function DialogTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: ReactNode;
}) {
  void asChild;
  return <>{children}</>;
}

export function DialogContent({
  className = "",
  ...props
}: { className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-lg ${className}`}
      {...props}
    />
  );
}

export function DialogHeader({
  className = "",
  ...props
}: { className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`mb-4 ${className}`} {...props} />;
}

export function DialogTitle({
  className = "",
  ...props
}: { className?: string } & React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={`text-lg font-semibold text-slate-900 ${className}`}
      {...props}
    />
  );
}
