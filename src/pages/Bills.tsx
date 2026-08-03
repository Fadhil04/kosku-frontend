import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { billsApi } from '../api/bills';
import { DashboardLayout } from '../components/DashboardLayout';
import { AlertCircle, X, Receipt, Clock, CheckCircle2 } from 'lucide-react';
import type { Bill } from '../types';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

const STATUS_CONFIG: Record<string, { label: string; cn: string }> = {
  PAID: { label: 'Lunas', cn: 'badge-paid' },
  UNPAID: { label: 'Belum Lunas', cn: 'badge-unpaid' },
  PARTIALLY_PAID: { label: 'Sebagian', cn: 'badge-partial' },
  WAIVED: { label: 'Dihapuskan', cn: 'badge-waived' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, cn: 'badge' };
  return <span className={cfg.cn}>{cfg.label}</span>;
}

// ── Payment Modal ────────────────────────────────────────────────
function PaymentModal({
  bill,
  onClose,
  onSuccess,
}: {
  bill: Bill;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState(bill.final_amount.toString());
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [refNumber, setRefNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await billsApi.recordPayment(bill.id, {
        idempotency_key: `pay-${bill.id}-${Date.now()}`,
        amount: Number(amount),
        payment_method: method,
        payment_date: new Date().toISOString().split('T')[0],
        reference_number: refNumber || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Gagal mencatat pembayaran',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-modal w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <div>
            <h2 className="text-headline-sm font-bold text-on-surface">Catat Pembayaran</h2>
            <p className="text-body-sm text-on-surface-variant mt-0.5">{bill.tenant.full_name}</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>

        {/* Summary strip */}
        <div className="px-6 py-3 bg-surface-container-low border-b border-outline-variant">
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-on-surface-variant">
              {bill.property.name} · Kamar {bill.room.room_number} · {MONTH_NAMES[bill.period_month - 1]} {bill.period_year}
            </span>
            <span className="text-money font-semibold text-on-surface text-body-md">
              Rp {fmt(bill.final_amount)}
            </span>
          </div>
          {bill.late_fee_info.is_overdue && (
            <p className="text-body-sm text-error mt-1">
              Termasuk denda Rp {fmt(bill.late_fee_info.late_fee_amount)} ({bill.late_fee_info.days_overdue} hari terlambat)
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Jumlah Pembayaran (Rp)</label>
            <input
              type="number"
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Metode Pembayaran</label>
            <select
              className="input"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="CASH">Tunai</option>
              <option value="BANK_TRANSFER">Transfer Bank</option>
              <option value="EWALLET">E-Wallet</option>
              <option value="OTHER">Lainnya</option>
            </select>
          </div>
          <div>
            <label className="label">Nomor Referensi <span className="text-on-surface-variant font-normal">(opsional)</span></label>
            <input
              className="input"
              placeholder="TRF20260701001"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-error-container rounded-lg">
              <AlertCircle size={15} className="text-error shrink-0 mt-0.5" />
              <p className="text-body-sm text-error-on-container">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Batal
            </button>
            <button type="submit" disabled={isLoading} className="btn-success flex-1">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  Konfirmasi Bayar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Bill Row ─────────────────────────────────────────────────────
function BillRow({ bill, onPayClick }: { bill: Bill; onPayClick: (b: Bill) => void }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
  const canPay = bill.status === 'UNPAID' || bill.status === 'PARTIALLY_PAID';

  return (
    <tr>
      <td>
        <p className="font-medium text-on-surface">{bill.tenant.full_name}</p>
        <p className="text-body-sm text-on-surface-variant mt-0.5">
          {bill.property.name} · Kamar {bill.room.room_number}
        </p>
      </td>
      <td>
        <span className="font-mono text-label-md text-on-surface-variant">
          {MONTH_NAMES[bill.period_month - 1]} {bill.period_year}
        </span>
      </td>
      <td>
        <p className="text-money text-on-surface">{fmt(bill.final_amount)}</p>
        {bill.late_fee_info.late_fee_amount > 0 && (
          <p className="text-body-sm text-error mt-0.5">
            +{fmt(bill.late_fee_info.late_fee_amount)} denda
          </p>
        )}
      </td>
      <td>
        {new Date(bill.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
      </td>
      <td>
        <div className="flex items-center gap-2">
          <StatusBadge status={bill.status} />
          {bill.late_fee_info.is_overdue && (
            <span className="flex items-center gap-1 text-body-sm text-error">
              <Clock size={12} />
              {bill.late_fee_info.days_overdue}h
            </span>
          )}
        </div>
      </td>
      <td>
        {canPay ? (
          <button
            onClick={() => onPayClick(bill)}
            className="btn-success btn-sm"
          >
            Catat Bayar
          </button>
        ) : (
          <span className="text-body-sm text-on-surface-variant">—</span>
        )}
      </td>
    </tr>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export function BillsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['bills', statusFilter],
    queryFn: () => billsApi.getAll({ status: statusFilter || undefined }),
  });

  const bills = data?.data ?? [];

  const counts = bills.reduce(
    (acc, b) => {
      acc[b.status] = (acc[b.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <>
      <DashboardLayout
        title="Tagihan"
        subtitle="Kelola tagihan dan catat pembayaran penghuni"
        action={
          <div className="flex items-center gap-3">
            <select
              className="input py-2 w-40"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="UNPAID">Belum Lunas</option>
              <option value="PARTIALLY_PAID">Sebagian</option>
              <option value="PAID">Lunas</option>
              <option value="WAIVED">Dihapuskan</option>
            </select>
          </div>
        }
      >
        {/* Quick filters / stat chips */}
        {!isLoading && bills.length > 0 && (
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            {[
              { key: 'UNPAID', label: 'Belum Lunas', cn: 'bg-error-container text-error-on-container' },
              { key: 'PARTIALLY_PAID', label: 'Sebagian', cn: 'bg-tertiary-fixed text-tertiary-container' },
              { key: 'PAID', label: 'Lunas', cn: 'bg-secondary-container text-secondary-on-container' },
            ].map(({ key, label, cn }) =>
              counts[key] ? (
                <button
                  key={key}
                  onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-body-sm font-medium transition-all ${cn} ${statusFilter === key ? 'ring-2 ring-offset-1 ring-current' : 'opacity-80 hover:opacity-100'}`}
                >
                  <span className="font-mono font-bold">{counts[key]}</span>
                  {label}
                </button>
              ) : null,
            )}
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="card overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-4 py-4 border-b border-outline-variant/50">
                <div className="flex gap-4 items-center">
                  <div className="skeleton h-4 flex-1 rounded" />
                  <div className="skeleton h-4 w-20 rounded" />
                  <div className="skeleton h-4 w-24 rounded" />
                  <div className="skeleton h-6 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : bills.length === 0 ? (
          <div className="card p-16 text-center">
            <Receipt size={40} className="mx-auto text-outline mb-4" />
            <p className="text-body-md text-on-surface-variant">Tidak ada tagihan ditemukan</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Penghuni</th>
                    <th>Periode</th>
                    <th>Jumlah</th>
                    <th>Jatuh Tempo</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <BillRow key={bill.id} bill={bill} onPayClick={setSelectedBill} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DashboardLayout>

      {selectedBill && (
        <PaymentModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['bills'] })}
        />
      )}
    </>
  );
}
