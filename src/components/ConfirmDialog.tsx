import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const btnCn = variant === 'danger' ? 'btn-danger' : variant === 'warning' ? 'btn-primary' : 'btn-primary';
  const iconCn = variant === 'danger' ? 'text-error bg-error-container' : 'text-tertiary-on-container bg-tertiary-fixed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm animate-fade-in" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-modal w-full max-w-sm animate-slide-up">
        <div className="flex items-start gap-4 p-6">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconCn}`}>
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-body-lg font-bold text-on-surface">{title}</h3>
            <p className="text-body-sm text-on-surface-variant mt-1.5 leading-relaxed">{description}</p>
          </div>
          <button onClick={onCancel} className="btn-icon shrink-0 -mt-1 -mr-1">
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onCancel} disabled={isLoading} className="btn-secondary flex-1">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} disabled={isLoading} className={`${btnCn} flex-1`}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memproses...
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
