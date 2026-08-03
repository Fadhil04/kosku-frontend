import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reports';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Building2,
  DoorOpen,
  Receipt,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'text-slate-700',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="bg-slate-100 p-3 rounded-full">
            <Icon size={20} className="text-slate-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportsApi.getDashboard,
    refetchInterval: 5 * 60 * 1000, // refresh tiap 5 menit
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 bg-slate-100 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-500 mt-1">Ringkasan semua properti kamu</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Properti"
            value={data.total_properties}
            icon={Building2}
          />
          <StatCard
            title="Total Kamar"
            value={data.total_rooms}
            subtitle={`Terisi: ${data.room_status['OCCUPIED'] || 0}`}
            icon={DoorOpen}
          />
          <StatCard
            title="Tingkat Hunian"
            value={`${data.overall_occupancy_rate}%`}
            icon={TrendingUp}
            color={data.overall_occupancy_rate >= 80 ? 'text-green-600' : 'text-orange-500'}
          />
          <StatCard
            title="Kontrak Aktif"
            value={data.total_active_contracts}
            icon={Receipt}
          />
        </div>

        {/* Revenue + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Revenue Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Pendapatan Bulan Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Total Tagihan</span>
                  <span className="font-medium">
                    {formatRupiah(data.current_month_revenue.billed)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Sudah Terkumpul</span>
                  <span className="font-medium text-green-600">
                    {formatRupiah(data.current_month_revenue.collected)}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Collection Rate</span>
                    <span className={`font-bold text-lg ${
                      data.current_month_revenue.collection_rate >= 90
                        ? 'text-green-600'
                        : data.current_month_revenue.collection_rate >= 70
                          ? 'text-orange-500'
                          : 'text-red-600'
                    }`}>
                      {data.current_month_revenue.collection_rate}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-2 bg-slate-100 rounded-full">
                    <div
                      className="h-2 bg-green-500 rounded-full transition-all"
                      style={{ width: `${data.current_month_revenue.collection_rate}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Perlu Perhatian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.overdue_bills > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                    <AlertTriangle size={16} className="text-red-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-700">
                        {data.overdue_bills} tagihan terlambat
                      </p>
                    </div>
                  </div>
                )}
                {data.open_complaints > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                    <MessageSquare size={16} className="text-orange-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-orange-700">
                        {data.open_complaints} komplain belum ditangani
                      </p>
                    </div>
                  </div>
                )}
                {data.contracts_expiring_30_days > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                    <Receipt size={16} className="text-blue-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-700">
                        {data.contracts_expiring_30_days} kontrak akan berakhir
                      </p>
                    </div>
                  </div>
                )}
                {data.overdue_bills === 0 &&
                  data.open_complaints === 0 &&
                  data.contracts_expiring_30_days === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">
                      Semua berjalan lancar ✓
                    </p>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}