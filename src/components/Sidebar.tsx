import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Building2,
  FileText,
  Users,
  Receipt,
  MessageSquare,
  BarChart3,
  LogOut,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/properties', label: 'Properti', icon: Building2 },
  { path: '/contracts', label: 'Kontrak', icon: FileText },
  { path: '/tenants', label: 'Penghuni', icon: Users },
  { path: '/bills', label: 'Tagihan', icon: Receipt },
  { path: '/complaints', label: 'Komplain', icon: MessageSquare },
  { path: '/reports', label: 'Laporan', icon: BarChart3 },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'KO';

  return (
    <aside className="w-64 bg-surface-container flex flex-col h-screen fixed left-0 top-0 border-r border-outline-variant z-40">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Building2 size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-on-surface text-body-lg leading-tight">KosKu</p>
            <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider">
              Admin Portal
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              className={isActive ? 'nav-item-active' : 'nav-item-inactive'}
            >
              <Icon size={17} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && (
                <ChevronRight size={14} className="opacity-60 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-outline-variant space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
            <span className="font-mono text-label-sm text-primary-container font-bold">
              {initials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body-sm font-semibold text-on-surface truncate">
              {user?.full_name ?? 'Owner'}
            </p>
            <p className="font-mono text-label-sm text-on-surface-variant truncate">
              {user?.email ?? ''}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="nav-item-inactive w-full text-left"
        >
          <LogOut size={17} className="shrink-0" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
