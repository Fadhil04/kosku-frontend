import type { ReactNode } from "react";

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Select({
  value,
  onValueChange,
  children,
  className = "",
}: SelectProps) {
  void value;
  void onValueChange;
  return <div className={`inline-flex w-full ${className}`}>{children}</div>;
}

export function SelectTrigger({
  className = "",
  ...props
}: { className?: string } & React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-900 ${className}`}
      {...props}
    />
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span>{placeholder}</span>;
}

export function SelectContent({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`mt-2 rounded-md border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function SelectItem({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) {
  void value;
  return (
    <button
      type="button"
      className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
    >
      {children}
    </button>
  );
}
