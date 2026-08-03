import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function DashboardLayout({ children, title, subtitle, action }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        {/* Page header */}
        {(title || action) && (
          <header className="sticky top-0 z-30 bg-background border-b border-outline-variant px-8 py-5 flex items-center justify-between gap-4">
            <div>
              {title && (
                <h1 className="text-headline-sm text-on-surface font-bold">{title}</h1>
              )}
              {subtitle && (
                <p className="text-body-sm text-on-surface-variant mt-0.5">{subtitle}</p>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </header>
        )}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
