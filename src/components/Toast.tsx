import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const CFG: Record<ToastType, { icon: React.ElementType; bg: string; text: string; border: string }> = {
  success: { icon: CheckCircle2, bg: 'bg-secondary-container', text: 'text-secondary',          border: 'border-secondary/30' },
  error:   { icon: AlertCircle,  bg: 'bg-error-container',     text: 'text-error',              border: 'border-error/30' },
  info:    { icon: Info,         bg: 'bg-primary-fixed',       text: 'text-primary-container',  border: 'border-primary/30' },
};

function ToastItem({ item, onRemove }: { item: ToastItem; onRemove: (id: string) => void }) {
  const cfg = CFG[item.type];
  const Icon = cfg.icon;

  useEffect(() => {
    const t = setTimeout(() => onRemove(item.id), 4000);
    return () => clearTimeout(t);
  }, [item.id, onRemove]);

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-card-hover max-w-sm w-full animate-slide-up ${cfg.bg} ${cfg.border}`}>
      <Icon size={16} className={`${cfg.text} shrink-0 mt-0.5`} />
      <p className={`text-body-sm flex-1 ${cfg.text} font-medium`}>{item.message}</p>
      <button onClick={() => onRemove(item.id)} className={`${cfg.text} hover:opacity-70 shrink-0`}>
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-4), { id, type, message }]);
  }, []);

  const value: ToastContextValue = {
    toast,
    success: (m) => toast(m, 'success'),
    error:   (m) => toast(m, 'error'),
    info:    (m) => toast(m, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem item={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
