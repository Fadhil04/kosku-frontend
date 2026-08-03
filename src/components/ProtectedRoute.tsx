import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Building2 } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-card">
            <Building2 size={19} className="text-white" />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-4 h-4 border-2 border-primary/25 border-t-primary rounded-full animate-spin" />
            <span className="text-body-md text-on-surface-variant">Memuat sesi...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
