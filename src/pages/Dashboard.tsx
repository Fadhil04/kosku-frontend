import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reports';
import { DashboardLayout } from '../components/DashboardLayout';
import { Link } from 'react-router-dom';
import { OnboardingBanner } from '../components/OnboardingBanner';
import {
  Building2,
  BedDouble,
  TrendingUp,
  FileText,
  AlertTriangle,
  MessageSquare,
  Receipt,
  CheckCircle2,
} from 'lucide-react';

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent = 'blue',
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: 'blue' | 'green' | 'amber' | 'red';
}) {
  const iconBg = {
    blue: 'bg-primary-fixed text-primary-container',
    green: 'bg-secondary-container text-secondary',
    amber: 'bg-tertiary-fixed text-tertiary-container',
    red: 'bg-error-container text-error',
  }[accent];

  const valueCn = {
    blue: 'text-primary',
    green: 'text-secondary',
    amber: 'text-tertiary-on-container',
    red: 'text-error',
  }[accent];

  return (
    <div className="card p-5 flex items-start justify-between gap-4">
      <div>
        <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">
          {title}
        </p>
        <p className={`text-2xl font-bold tabular-nums ${valueCn}`}>{value}</p>
        {sub && <p className="text-body-sm text-on-surface-variant mt-1">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={18} />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="skeleton h-4 w-24 mb-3 rounded" />
      <div className="skeleton h-7 w-16 rounded" />
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportsApi.getDashboard,
    // Refresh setiap 2 menit dan saat window refocus
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(n);

  const now = new Date();
  const monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={`Ringkasan per ${monthName}`}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Onboarding untuk owner baru */}
        {!isLoading && data && data.total_properties === 0 && <OnboardingBanner />}

        {/* Stat cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : data ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Properti"
              value={data.total_properties}
              icon={Building2}
              accent="blue"
            />
            <StatCard
              title="Total Kamar"
              value={data.total_rooms}
              sub={`${data.room_status?.['OCCUPIED'] ?? 0} kamar terisi`}
              icon={BedDouble}
              accent="blue"
            />
            <StatCard
              title="Tingkat Hunian"
              value={`${data.overall_occupancy_rate}%`}
              sub={data.overall_occupancy_rate >= 80 ? 'Sangat baik' : 'Perlu ditingkatkan'}
              icon={TrendingUp}
              accent={data.overall_occupancy_rate >= 80 ? 'green' : 'amber'}
            />
            <StatCard
              title="Kontrak Aktif"
              value={data.total_active_contracts}
              icon={FileText}
              accent="blue"
            />
          </div>
        ) : null}

        {/* Revenue + Alerts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Revenue Card */}
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest">
                  Pendapatan Bulan Ini
                </p>
                <p className="text-body-sm text-on-surface-variant mt-0.5">{monthName}</p>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="skeleton h-5 rounded" />)}
              </div>
            ) : data ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-outline-variant/50">
                  <span className="text-body-md text-on-surface-variant">Total Tagihan</span>
                  <span className="text-money text-on-surface text-body-md">
                    {formatRupiah(data.current_month_revenue.billed)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-outline-variant/50">
                  <span className="text-body-md text-on-surface-variant">Sudah Terkumpul</span>
                  <span className="text-money text-secondary font-semibold text-body-md">
                    {formatRupiah(data.current_month_revenue.collected)}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-body-md font-semibold text-on-surface">Collection Rate</span>
                    <span className={`text-money text-xl font-bold ${
                      data.current_month_revenue.collection_rate >= 90
                        ? 'text-secondary'
                        : data.current_month_revenue.collection_rate >= 70
                          ? 'text-tertiary-on-container'
                          : 'text-error'
                    }`}>
                      {data.current_month_revenue.collection_rate}%
                    </span>
                  </div>
                  <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        data.current_month_revenue.collection_rate >= 90
                          ? 'bg-secondary'
                          : data.current_month_revenue.collection_rate >= 70
                            ? 'bg-tertiary-on-container'
                            : 'bg-error'
                      }`}
                      style={{ width: `${Math.min(data.current_month_revenue.collection_rate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Alerts Card */}
          <div className="card p-6">
            <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-4">
              Perlu Perhatian
            </p>

            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-lg" />)}
              </div>
            ) : data ? (
              <div className="space-y-2.5">
                {data.overdue_bills > 0 && (
                  <Link to="/bills?status=UNPAID" className="flex items-start gap-3 p-3 bg-error-container rounded-lg hover:opacity-90 transition-opacity">
                    <AlertTriangle size={15} className="text-error shrink-0 mt-0.5" />
                    <div>
                      <p className="text-body-sm font-semibold text-error-on-container">
                        {data.overdue_bills} tagihan melewati jatuh tempo
                      </p>
                      <p className="text-body-sm text-error-on-container/70 mt-0.5">
                        Perlu tindak lanjut — klik untuk lihat
                      </p>
                    </div>
                  </Link>
                )}

                {data.open_complaints > 0 && (
                  <Link to="/complaints?status=OPEN" className="flex items-start gap-3 p-3 bg-tertiary-fixed rounded-lg hover:opacity-90 transition-opacity">
                    <MessageSquare size={15} className="text-tertiary-container shrink-0 mt-0.5" />
                    <div>
                      <p className="text-body-sm font-semibold text-tertiary-container">
                        {data.open_complaints} komplain belum ditangani
                      </p>
                      <p className="text-body-sm text-tertiary-container/70 mt-0.5">
                        Penghuni menunggu respons
                      </p>
                    </div>
                  </Link>
                )}

                {data.contracts_expiring_30_days > 0 && (
                  <Link to="/contracts?status=ACTIVE" className="flex items-start gap-3 p-3 bg-primary-fixed rounded-lg hover:opacity-90 transition-opacity">
                    <Receipt size={15} className="text-primary-container shrink-0 mt-0.5" />
                    <div>
                      <p className="text-body-sm font-semibold text-primary-container">
                        {data.contracts_expiring_30_days} kontrak akan berakhir
                      </p>
                      <p className="text-body-sm text-primary-container/70 mt-0.5">
                        Dalam 30 hari ke depan
                      </p>
                    </div>
                  </Link>
                )}

                {data && data.overdue_bills === 0 && data.open_complaints === 0 && data.contracts_expiring_30_days === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                    <CheckCircle2 size={32} className="text-secondary" />
                    <p className="text-body-sm text-on-surface-variant">
                      Semua berjalan lancar
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Room status breakdown */}
        {!isLoading && data && (
          <div className="card p-6">
            <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-4">
              Status Kamar
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { key: 'AVAILABLE', label: 'Tersedia', color: 'bg-secondary-container text-secondary' },
                { key: 'OCCUPIED', label: 'Terisi', color: 'bg-primary-fixed text-primary-container' },
                { key: 'RESERVED', label: 'Direservasi', color: 'bg-tertiary-fixed text-tertiary-container' },
                { key: 'NEEDS_MAINTENANCE', label: 'Maintenance', color: 'bg-error-container text-error' },
              ].map(({ key, label, color }) => (
                <div key={key} className="bg-surface-container-low rounded-lg p-4 text-center">
                  <p className={`text-2xl font-bold tabular-nums ${color.split(' ')[1]}`}>
                    {data.room_status?.[key] ?? 0}
                  </p>
                  <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider mt-1">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
