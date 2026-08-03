import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { billsApi } from '../api/bills';
import { DashboardLayout } from '../components/DashboardLayout';
import { Pagination } from '../components/Pagination';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import {
  AlertCircle, X, Receipt, Clock, CheckCircle2,
  Tag, Ban, ChevronDown, History,
} from 'lucide-react';
import type { Bill, Payment } from '../types';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const STATUS_CONFIG: Record<string, { label: string; cn: string }> = {
  PAID:           { label: 'Lunas',       cn: 'badge-paid' },
  UNPAID:         { label: 'Belum Lunas', cn: 'badge-unpaid' },
  PARTIALLY_PAID: { label: 'Sebagian',    cn: 'badge-partial' },
  WAIVED:         { label: 'Dihapuskan',  cn: 'badge-waived' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, cn: 'badge' };
  return <span className={cfg.cn}>{cfg.label}</span>;
}

// ── Payment Modal ─────────────────────────────────────────────────
function PaymentModal({ bill, onClose, onSuccess }: { bill: Bill; onClose: () => void; onSuccess: () => void }) {
  const { success, error: toastError } = useToast();
  const [amount, setAmount] = useState(bill.final_amount.toString());
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [refNumber, setRefNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError('');
    try {
      await billsApi.recordPayment(bill.id, {
        idempotency_key: `pay-${bill.id}-${Date.now()}`,
        amount: Number(amount),
        payment_method: method,
        payment_date: new Date().toISOString().split('T')[0],
        reference_number: refNumber || undefined,
      });
      success('Pembayaran berhasil dicatat');
      onSuccess(); onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal mencatat pembayaran';
      setError(msg); toastError(msg);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-modal w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <div><h2 className="text-headline-sm font-bold text-on-surface">Catat Pembayaran</h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5">{bill.tenant.full_name}</p></div>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>
        <div className="px-6 py-3 bg-surface-container-low border-b border-outline-variant space-y-1">
          <div className="flex justify-between text-body-sm">
            <span className="text-on-surface-variant">{bill.property.name} · Kamar {bill.room.room_number} · {MONTH_NAMES[bill.period_month-1]} {bill.period_year}</span>
          </div>
          <div className="flex justify-between text-body-md font-semibold border-t border-outline-variant/50 pt-1.5">
            <span className="text-on-surface">Tagihan</span>
            <span className="text-money text-on-surface">{fmt(bill.final_amount)}</span>
          </div>
          {bill.overdue_info.is_overdue && (
            <p className="text-body-sm text-error flex items-center gap-1">
              <Clock size={12} />{bill.overdue_info.days_overdue} hari melewati jatuh tempo
            </p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div><label className="label">Jumlah Pembayaran (Rp)</label>
            <input type="number" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} max={bill.final_amount} required />
            {Number(amount) < bill.final_amount && Number(amount) > 0 && (
              <p className="text-body-sm text-tertiary-on-container mt-1">⚠ Pembayaran sebagian — sisa {fmt(bill.final_amount - Number(amount))}</p>
            )}
          </div>
          <div><label className="label">Metode</label>
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="CASH">Tunai</option>
              <option value="BANK_TRANSFER">Transfer Bank</option>
              <option value="EWALLET">E-Wallet</option>
              <option value="OTHER">Lainnya</option>
            </select>
          </div>
          <div><label className="label">Nomor Referensi <span className="text-on-surface-variant font-normal">opsional</span></label>
            <input className="input" placeholder="TRF..." value={refNumber} onChange={(e) => setRefNumber(e.target.value)} />
          </div>
          {error && <div className="flex items-start gap-2.5 p-3 bg-error-container rounded-lg"><AlertCircle size={15} className="text-error shrink-0 mt-0.5" /><p className="text-body-sm text-error-on-container">{error}</p></div>}
          <div className="flex gap-3"><button type="button" onClick={onClose} className="btn-secondary flex-1">Batal</button>
            <button type="submit" disabled={isLoading} className="btn-success flex-1">
              {isLoading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menyimpan...</span> : <><CheckCircle2 size={15} />Konfirmasi</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Discount Modal ────────────────────────────────────────────────
function DiscountModal({ bill, onClose, onSuccess }: { bill: Bill; onClose: () => void; onSuccess: () => void }) {
  const { success, error: toastError } = useToast();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await billsApi.applyDiscount(bill.id, { discount_amount: Number(amount), discount_reason: reason });
      success('Diskon berhasil diterapkan');
      onSuccess(); onClose();
    } catch (err: unknown) {
      toastError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal terapkan diskon');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-modal w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h2 className="text-headline-sm font-bold text-on-surface">Beri Diskon</h2>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>
        <form id="discount-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div><label className="label">Jumlah Diskon (Rp)</label>
            <input type="number" className="input" placeholder="100000" value={amount} onChange={(e) => setAmount(e.target.value)} required max={bill.total_amount} />
            <p className="text-body-sm text-on-surface-variant mt-1">Tagihan: {fmt(bill.total_amount)}</p>
          </div>
          <div><label className="label">Alasan Diskon</label>
            <input className="input" placeholder="Keringanan khusus..." value={reason} onChange={(e) => setReason(e.target.value)} required minLength={5} />
          </div>
        </form>
        <div className="px-6 py-4 border-t border-outline-variant flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button type="submit" form="discount-form" disabled={isLoading} className="btn-primary flex-1">
            {isLoading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />...</span> : <><Tag size={14} />Terapkan</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bill Detail Modal ─────────────────────────────────────────────
function BillDetailModal({ bill, onClose }: { bill: Bill; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ['bill-payments', bill.id],
    queryFn: () => billsApi.getPayments(bill.id),
  });
  const payments: Payment[] = (data as { payments?: Payment[] })?.payments ?? [];
  const totalPaid = (data as { total_paid?: number })?.total_paid ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-modal w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <div>
            <h2 className="text-headline-sm font-bold text-on-surface">Detail Tagihan</h2>
            <p className="text-body-sm text-on-surface-variant">{bill.tenant.full_name} · {MONTH_NAMES[bill.period_month-1]} {bill.period_year}</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-body-sm">
            <div><p className="text-on-surface-variant">Tagihan Pokok</p><p className="font-semibold text-on-surface text-money">{fmt(bill.base_rent)}</p></div>
            <div><p className="text-on-surface-variant">Diskon</p><p className="font-semibold text-secondary text-money">{bill.discount_amount > 0 ? `-${fmt(bill.discount_amount)}` : '—'}</p></div>
            <div><p className="text-on-surface-variant">Total Tagihan</p><p className="font-bold text-on-surface text-money">{fmt(bill.final_amount)}</p></div>
            <div><p className="text-on-surface-variant">Sudah Dibayar</p><p className="font-semibold text-secondary text-money">{fmt(totalPaid)}</p></div>
          </div>
          {bill.discount_reason && <p className="text-body-sm text-on-surface-variant">Alasan diskon: <span className="text-on-surface">{bill.discount_reason}</span></p>}
          <div className="pt-3 border-t border-outline-variant/50">
            <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">Riwayat Pembayaran</p>
            {payments.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant text-center py-3">Belum ada pembayaran</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-outline-variant/30 last:border-0">
                    <div>
                      <p className="text-body-sm font-medium text-on-surface text-money">{fmt(p.amount)}</p>
                      <p className="text-body-sm text-on-surface-variant">{new Date(p.payment_date).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })} · {p.payment_method}</p>
                    </div>
                    {p.reference_number && <span className="font-mono text-label-sm text-on-surface-variant">{p.reference_number}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Bill Row ──────────────────────────────────────────────────────
function BillRow({ bill, onPayClick, onDiscountClick, onWaiveClick, onDetailClick }: {
  bill: Bill;
  onPayClick: (b: Bill) => void;
  onDiscountClick: (b: Bill) => void;
  onWaiveClick: (b: Bill) => void;
  onDetailClick: (b: Bill) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const canPay = bill.status === 'UNPAID' || bill.status === 'PARTIALLY_PAID';
  const canAction = bill.status !== 'PAID' && bill.status !== 'WAIVED';

  return (
    <tr>
      <td>
        <p className="font-medium text-on-surface">{bill.tenant.full_name}</p>
        <p className="text-body-sm text-on-surface-variant mt-0.5">{bill.property.name} · Kamar {bill.room.room_number}</p>
      </td>
      <td><span className="font-mono text-label-md text-on-surface-variant">{MONTH_NAMES[bill.period_month-1]} {bill.period_year}</span></td>
      <td>
        <p className="text-money text-on-surface">{fmt(bill.final_amount)}</p>
        {bill.discount_amount > 0 && <p className="text-body-sm text-secondary mt-0.5">Diskon -{fmt(bill.discount_amount)}</p>}
      </td>
      <td>{new Date(bill.due_date).toLocaleDateString('id-ID', { day:'numeric', month:'short' })}</td>
      <td>
        <div className="flex items-center gap-2">
          <StatusBadge status={bill.status} />
          {bill.overdue_info.is_overdue && (
            <span className="flex items-center gap-1 text-body-sm text-error">
              <Clock size={12} />{bill.overdue_info.days_overdue}h
            </span>
          )}
        </div>
      </td>
      <td>
        <div className="flex items-center gap-2">
          {canPay && <button onClick={() => onPayClick(bill)} className="btn-success btn-sm">Bayar</button>}
          <button onClick={() => onDetailClick(bill)} className="btn-ghost btn-sm p-1.5" title="Riwayat"><History size={14} /></button>
          {canAction && (
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="btn-ghost btn-sm p-1.5"><ChevronDown size={14} /></button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-outline-variant rounded-lg shadow-card-hover z-10 min-w-[140px] overflow-hidden" onMouseLeave={() => setShowMenu(false)}>
                  <button onClick={() => { setShowMenu(false); onDiscountClick(bill); }} className="w-full px-3 py-2.5 text-left text-body-sm hover:bg-surface-container-low flex items-center gap-2">
                    <Tag size={13} className="text-primary" />Beri Diskon
                  </button>
                  <button onClick={() => { setShowMenu(false); onWaiveClick(bill); }} className="w-full px-3 py-2.5 text-left text-body-sm hover:bg-surface-container-low flex items-center gap-2 text-error">
                    <Ban size={13} />Hapuskan
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export function BillsPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [discountBill, setDiscountBill] = useState<Bill | null>(null);
  const [waivedBill, setWaivedBill] = useState<Bill | null>(null);
  const [detailBill, setDetailBill] = useState<Bill | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['bills', statusFilter, page],
    queryFn: () => billsApi.getAll({ status: statusFilter || undefined, page, limit: 20 }),
  });

  const bills = data?.data ?? [];
  const meta = data?.meta;

  const counts = bills.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleWaive = async () => {
    if (!waivedBill) return;
    try {
      await billsApi.waiveBill(waivedBill.id, { reason: 'Dihapuskan oleh owner' });
      success('Tagihan berhasil dihapuskan');
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    } catch (err: unknown) {
      toastError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal hapuskan tagihan');
    } finally { setWaivedBill(null); }
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['bills'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  return (
    <>
      <DashboardLayout
        title="Tagihan"
        subtitle="Kelola tagihan dan catat pembayaran penghuni"
        action={
          <select className="input py-2 w-40" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Semua Status</option>
            <option value="UNPAID">Belum Lunas</option>
            <option value="PARTIALLY_PAID">Sebagian</option>
            <option value="PAID">Lunas</option>
            <option value="WAIVED">Dihapuskan</option>
          </select>
        }
      >
        {/* Quick filter chips */}
        {!isLoading && bills.length > 0 && (
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            {[
              { key: 'UNPAID', label: 'Belum Lunas', cn: 'bg-error-container text-error-on-container' },
              { key: 'PARTIALLY_PAID', label: 'Sebagian', cn: 'bg-tertiary-fixed text-tertiary-container' },
              { key: 'PAID', label: 'Lunas', cn: 'bg-secondary-container text-secondary-on-container' },
            ].map(({ key, label, cn }) => counts[key] ? (
              <button key={key} onClick={() => { setStatusFilter(statusFilter === key ? '' : key); setPage(1); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-body-sm font-medium transition-all ${cn} ${statusFilter === key ? 'ring-2 ring-offset-1 ring-current' : 'opacity-80 hover:opacity-100'}`}>
                <span className="font-mono font-bold">{counts[key]}</span>{label}
              </button>
            ) : null)}
          </div>
        )}

        {isLoading ? (
          <div className="card overflow-hidden">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="px-4 py-4 border-b border-outline-variant/50">
                <div className="flex gap-4"><div className="skeleton h-4 flex-1 rounded" /><div className="skeleton h-4 w-20 rounded" /><div className="skeleton h-6 w-16 rounded-full" /></div>
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
                <thead><tr><th>Penghuni</th><th>Periode</th><th>Jumlah</th><th>Jatuh Tempo</th><th>Status</th><th>Aksi</th></tr></thead>
                <tbody>
                  {bills.map(b => (
                    <BillRow key={b.id} bill={b}
                      onPayClick={setSelectedBill}
                      onDiscountClick={setDiscountBill}
                      onWaiveClick={setWaivedBill}
                      onDetailClick={setDetailBill}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            {meta && <div className="px-4 pb-2"><Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={20} onPageChange={setPage} /></div>}
          </div>
        )}
      </DashboardLayout>

      {selectedBill && <PaymentModal bill={selectedBill} onClose={() => setSelectedBill(null)} onSuccess={refresh} />}
      {discountBill && <DiscountModal bill={discountBill} onClose={() => setDiscountBill(null)} onSuccess={refresh} />}
      {detailBill && <BillDetailModal bill={detailBill} onClose={() => setDetailBill(null)} />}
      {waivedBill && (
        <ConfirmDialog
          title="Hapuskan Tagihan?"
          description={`Tagihan ${MONTH_NAMES[waivedBill.period_month-1]} ${waivedBill.period_year} untuk ${waivedBill.tenant.full_name} akan dihapuskan dan tidak perlu dibayar.`}
          confirmLabel="Ya, Hapuskan"
          variant="warning"
          onConfirm={handleWaive}
          onCancel={() => setWaivedBill(null)}
        />
      )}
    </>
  );
}
