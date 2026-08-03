import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reports';
import { propertiesApi } from '../api/properties';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  BarChart3, TrendingUp, Users, ChevronDown,
  AlertCircle, CheckCircle2, Clock,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import type { Property } from '../types';

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const fmtShort = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

// ── Tab button ────────────────────────────────────────────────────
function Tab({ label, active, onClick, icon: Icon }: {
  label: string; active: boolean; onClick: () => void; icon: React.ElementType;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-body-sm transition-all ${
        active
          ? 'bg-primary text-white shadow-sm'
          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

// ── Revenue Report ────────────────────────────────────────────────
function RevenueReport({ propertyId }: { propertyId: string }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ['report-revenue', propertyId, month, year],
    queryFn: () => reportsApi.getRevenue(propertyId, month, year),
    enabled: !!propertyId,
  });

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

  if (!propertyId) return (
    <div className="card p-12 text-center">
      <BarChart3 size={40} className="mx-auto text-outline mb-3" />
      <p className="text-body-md text-on-surface-variant">Pilih properti terlebih dahulu</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <select className="input py-2 w-36 appearance-none pr-8" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
        </div>
        <div className="relative">
          <select className="input py-2 w-28 appearance-none pr-8" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="card p-5"><div className="skeleton h-16 rounded" /></div>)}
        </div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Tagihan', value: fmt(data.summary.total_billed), accent: 'text-on-surface' },
              { label: 'Terkumpul', value: fmt(data.summary.total_collected), accent: 'text-secondary' },
              { label: 'Belum Lunas', value: fmt(data.summary.outstanding), accent: data.summary.outstanding > 0 ? 'text-error' : 'text-on-surface' },
              { label: 'Collection Rate', value: `${data.summary.collection_rate}%`, accent: data.summary.collection_rate >= 90 ? 'text-secondary' : data.summary.collection_rate >= 70 ? 'text-tertiary-on-container' : 'text-error' },
            ].map(({ label, value, accent }) => (
              <div key={label} className="card p-4">
                <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">{label}</p>
                <p className={`text-xl font-bold text-money ${accent}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Trend chart */}
          {data.trend && data.trend.length > 0 && (
            <div className="card p-5">
              <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-4">Tren 6 Bulan Terakhir</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.trend} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5eeff" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#444651' }} />
                  <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#444651' }} />
                  <Tooltip
                    formatter={(v) => fmt(Number(v))}
                    contentStyle={{ borderRadius: 8, border: '1px solid #c5c5d3', fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="billed" name="Tagihan" fill="#b6c4ff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" name="Terkumpul" fill="#006c49" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Per-room breakdown */}
          {data.breakdown_per_room && data.breakdown_per_room.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-outline-variant">
                <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest">Rincian per Kamar</p>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Kamar</th>
                      <th>Penghuni</th>
                      <th>Tagihan</th>
                      <th>Diskon</th>
                      <th>Dibayar</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.breakdown_per_room.map((row: {
                      room_number: string; tenant_name: string; billed: number;
                      discount: number; paid: number; status: string;
                    }) => (
                      <tr key={row.room_number}>
                        <td><span className="font-mono text-label-md">{row.room_number}</span></td>
                        <td>{row.tenant_name}</td>
                        <td className="text-money">{fmt(row.billed)}</td>
                        <td className="text-money text-on-surface-variant">{row.discount > 0 ? `-${fmt(row.discount)}` : '—'}</td>
                        <td className="text-money text-secondary">{fmt(row.paid)}</td>
                        <td>
                          <span className={`badge ${
                            row.status === 'PAID' ? 'bg-secondary-container text-secondary-on-container' :
                            row.status === 'UNPAID' ? 'bg-error-container text-error-on-container' :
                            'bg-tertiary-fixed text-tertiary-container'
                          }`}>
                            {row.status === 'PAID' ? 'Lunas' : row.status === 'UNPAID' ? 'Belum' : 'Sebagian'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

// ── Occupancy Report ──────────────────────────────────────────────
function OccupancyReport({ propertyId }: { propertyId: string }) {
  const [year, setYear] = useState(new Date().getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ['report-occupancy', propertyId, year],
    queryFn: () => reportsApi.getOccupancy(propertyId, year),
    enabled: !!propertyId,
  });

  if (!propertyId) return (
    <div className="card p-12 text-center">
      <TrendingUp size={40} className="mx-auto text-outline mb-3" />
      <p className="text-body-md text-on-surface-variant">Pilih properti terlebih dahulu</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Year selector */}
      <div className="relative inline-block">
        <select className="input py-2 w-28 appearance-none pr-8" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
      </div>

      {isLoading ? (
        <div className="card p-5"><div className="skeleton h-64 rounded" /></div>
      ) : data ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">Total Kamar</p>
              <p className="text-2xl font-bold text-on-surface tabular-nums">{data.total_rooms}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">Rata-rata Hunian</p>
              <p className={`text-2xl font-bold tabular-nums ${data.average_occupancy_rate >= 80 ? 'text-secondary' : 'text-tertiary-on-container'}`}>
                {data.average_occupancy_rate}%
              </p>
            </div>
            <div className="card p-4 text-center">
              <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">Status Saat Ini</p>
              <p className="text-2xl font-bold text-primary tabular-nums">{data.current_status?.['OCCUPIED'] ?? 0} terisi</p>
            </div>
          </div>

          {/* Monthly chart */}
          <div className="card p-5">
            <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-4">Tingkat Hunian per Bulan</p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.occupancy_per_month}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5eeff" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#444651' }} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#444651' }} />
                <Tooltip
                  formatter={(v) => [`${Number(v)}%`, 'Hunian']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #c5c5d3', fontSize: 12 }}
                />
                <Line type="monotone" dataKey="occupancy_rate" stroke="#006c49" strokeWidth={2} dot={{ r: 4, fill: '#006c49' }} name="Tingkat Hunian" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ── Payment Behavior Report ───────────────────────────────────────
function PaymentBehaviorReport({ propertyId }: { propertyId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['report-payment-behavior', propertyId],
    queryFn: () => reportsApi.getPaymentBehavior(propertyId, 6),
    enabled: !!propertyId,
  });

  if (!propertyId) return (
    <div className="card p-12 text-center">
      <Users size={40} className="mx-auto text-outline mb-3" />
      <p className="text-body-md text-on-surface-variant">Pilih properti terlebih dahulu</p>
    </div>
  );

  function scoreColor(score: number) {
    if (score >= 80) return 'text-secondary';
    if (score >= 60) return 'text-tertiary-on-container';
    return 'text-error';
  }

  function scoreBar(score: number) {
    if (score >= 80) return 'bg-secondary';
    if (score >= 60) return 'bg-tertiary-on-container';
    return 'bg-error';
  }

  return (
    <div className="space-y-5">
      {isLoading ? (
        <div className="card p-5"><div className="skeleton h-64 rounded" /></div>
      ) : data ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Tagihan', value: data.summary.total_bills, accent: 'text-on-surface' },
              { label: 'Tepat Waktu', value: data.summary.total_paid_on_time, accent: 'text-secondary' },
              { label: 'Terlambat', value: data.summary.total_paid_late, accent: 'text-tertiary-on-container' },
              { label: 'Belum Lunas', value: data.summary.total_unpaid, accent: data.summary.total_unpaid > 0 ? 'text-error' : 'text-on-surface' },
            ].map(({ label, value, accent }) => (
              <div key={label} className="card p-4">
                <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">{label}</p>
                <p className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Tenant table */}
          {data.tenant_stats && data.tenant_stats.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-outline-variant flex items-center justify-between">
                <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest">Skor Pembayaran Penghuni</p>
                <span className="text-body-sm text-on-surface-variant">{data.summary.period_months} bulan terakhir</span>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Penghuni</th>
                      <th>Tepat Waktu</th>
                      <th>Terlambat</th>
                      <th>Belum Lunas</th>
                      <th>Rata-rata Terlambat</th>
                      <th>Skor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tenant_stats.map((t: {
                      tenant_id: string; tenant_name: string; paid_on_time: number;
                      paid_late: number; unpaid: number; average_days_late: number; payment_score: number;
                    }) => (
                      <tr key={t.tenant_id}>
                        <td className="font-medium">{t.tenant_name}</td>
                        <td>
                          <span className="flex items-center gap-1 text-secondary">
                            <CheckCircle2 size={13} />
                            {t.paid_on_time}
                          </span>
                        </td>
                        <td>
                          <span className="flex items-center gap-1 text-tertiary-on-container">
                            <Clock size={13} />
                            {t.paid_late}
                          </span>
                        </td>
                        <td>
                          {t.unpaid > 0 ? (
                            <span className="flex items-center gap-1 text-error">
                              <AlertCircle size={13} />
                              {t.unpaid}
                            </span>
                          ) : <span className="text-on-surface-variant">—</span>}
                        </td>
                        <td className="font-mono text-label-md">
                          {t.average_days_late > 0 ? `${t.average_days_late} hari` : '—'}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${scoreBar(t.payment_score)}`} style={{ width: `${t.payment_score}%` }} />
                            </div>
                            <span className={`font-mono font-bold text-label-md ${scoreColor(t.payment_score)}`}>
                              {t.payment_score}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
type TabKey = 'revenue' | 'occupancy' | 'payment';

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('revenue');
  const [propertyId, setPropertyId] = useState('');

  const { data: propertiesData, isLoading: loadingProps } = useQuery({
    queryKey: ['properties'],
    queryFn: propertiesApi.getAll,
  });
  const properties: Property[] = propertiesData?.data ?? [];

  // Auto-select first property
  if (!propertyId && properties.length > 0 && !loadingProps) {
    setPropertyId(properties[0].id);
  }

  return (
    <DashboardLayout
      title="Laporan"
      subtitle="Analisis pendapatan, hunian, dan perilaku pembayaran"
      action={
        <div className="relative">
          <select
            className="input py-2 w-56 appearance-none pr-8"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
          >
            <option value="">Pilih Properti</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
        </div>
      }
    >
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 p-1 bg-surface-container-low rounded-xl w-fit">
        <Tab label="Pendapatan" active={activeTab === 'revenue'} onClick={() => setActiveTab('revenue')} icon={BarChart3} />
        <Tab label="Hunian" active={activeTab === 'occupancy'} onClick={() => setActiveTab('occupancy')} icon={TrendingUp} />
        <Tab label="Pembayaran" active={activeTab === 'payment'} onClick={() => setActiveTab('payment')} icon={Users} />
      </div>

      {/* Tab content */}
      <div className="animate-fade-in" key={activeTab}>
        {activeTab === 'revenue' && <RevenueReport propertyId={propertyId} />}
        {activeTab === 'occupancy' && <OccupancyReport propertyId={propertyId} />}
        {activeTab === 'payment' && <PaymentBehaviorReport propertyId={propertyId} />}
      </div>
    </DashboardLayout>
  );
}
