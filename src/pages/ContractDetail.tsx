import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { contractsApi } from '../api/contracts';
import { DashboardLayout } from '../components/DashboardLayout';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import {
  ArrowLeft, User, Building2, Calendar, Receipt,
  AlertCircle, CheckCircle2, Clock, RefreshCw, XCircle, ChevronDown, X,
} from 'lucide-react';
import { billsApi } from '../api/bills';
import type { Contract, ContractBill, Payment } from '../types';

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
const fmtDate = (s: string) => {
  const d = new Date(s);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];

const BILL_STATUS_CFG: Record<string, { label: string; cn: string }> = {
  PAID:           { label: 'Lunas',       cn: 'badge-paid' },
  UNPAID:         { label: 'Belum Lunas', cn: 'badge-unpaid' },
  PARTIALLY_PAID: { label: 'Sebagian',    cn: 'badge-partial' },
  WAIVED:         { label: 'Dihapuskan',  cn: 'badge-waived' },
};

const CONTRACT_STATUS_CFG: Record<string, { label: string; cn: string }> = {
  ACTIVE:     { label: 'Aktif',       cn: 'badge bg-secondary-container text-secondary-on-container' },
  PENDING:    { label: 'Pending',     cn: 'badge bg-primary-fixed text-primary-container' },
  TERMINATED: { label: 'Diterminasi', cn: 'badge bg-error-container text-error-on-container' },
  EXPIRED:    { label: 'Berakhir',    cn: 'badge bg-surface-container text-on-surface-variant' },
};

// ── Terminate Modal ───────────────────────────────────────────────
export function TerminateModal({ contractId, onClose, onSuccess }: {
  contractId: string; onClose: () => void; onSuccess: () => void;
}) {
  const { error: toastError } = useToast();
  const [form, setForm] = useState({
    termination_date: new Date().toISOString().split('T')[0],
    termination_reason: '',
    deposit_action: 'REFUND_FULL',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setErr('');
    try {
      await contractsApi.terminate(contractId, form as { termination_date: string; termination_reason: string; deposit_action: string });
      onSuccess(); onClose();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal terminasi kontrak';
      setErr(msg); toastError(msg);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-modal w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <div>
            <h2 className="text-headline-sm font-bold text-on-surface">Terminasi Kontrak</h2>
            <p className="text-body-sm text-on-surface-variant mt-0.5">Kontrak akan diakhiri dan kamar dikosongkan</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>
        <form id="terminate-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Tanggal Terminasi</label>
            <input type="date" className="input" value={form.termination_date}
              onChange={(e) => setForm((f) => ({ ...f, termination_date: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Alasan Terminasi</label>
            <input className="input" placeholder="Penghuni pindah, tidak perpanjang, dll..."
              value={form.termination_reason}
              onChange={(e) => setForm((f) => ({ ...f, termination_reason: e.target.value }))} required minLength={5} />
          </div>
          <div>
            <label className="label">Pengembalian Deposit</label>
            <div className="relative">
              <select className="input appearance-none pr-8" value={form.deposit_action}
                onChange={(e) => setForm((f) => ({ ...f, deposit_action: e.target.value }))}>
                <option value="REFUND_FULL">Kembalikan Penuh</option>
                <option value="REFUND_PARTIAL">Kembalikan Sebagian</option>
                <option value="FORFEIT">Tidak Dikembalikan</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
          </div>
          {err && (
            <div className="flex items-start gap-2.5 p-3 bg-error-container rounded-lg">
              <AlertCircle size={15} className="text-error shrink-0 mt-0.5" />
              <p className="text-body-sm text-error-on-container">{err}</p>
            </div>
          )}
        </form>
        <div className="px-6 py-4 border-t border-outline-variant flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button type="submit" form="terminate-form" disabled={isLoading} className="btn-danger flex-1">
            {isLoading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Memproses...</span> : <><XCircle size={15} />Terminasi</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Renew Modal ───────────────────────────────────────────────────
export function RenewModal({ contract, onClose, onSuccess }: {
  contract: Contract; onClose: () => void; onSuccess: () => void;
}) {
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState({
    new_end_date: '',
    new_monthly_rent: String(contract.monthly_rent),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setErr('');
    try {
      await contractsApi.renew(contract.id, {
        new_end_date: form.new_end_date,
        new_monthly_rent: Number(form.new_monthly_rent) || undefined,
      });
      success('Kontrak berhasil diperpanjang');
      onSuccess(); onClose();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal perpanjang kontrak';
      setErr(msg); toastError(msg);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-modal w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <div>
            <h2 className="text-headline-sm font-bold text-on-surface">Perpanjang Kontrak</h2>
            <p className="text-body-sm text-on-surface-variant mt-0.5">Tagihan baru akan digenerate otomatis</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>
        <form id="renew-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Tanggal Selesai Baru</label>
            <input type="date" className="input" value={form.new_end_date}
              onChange={(e) => setForm((f) => ({ ...f, new_end_date: e.target.value }))} required
              min={contract.end_date.split('T')[0]} />
          </div>
          <div>
            <label className="label">Harga Sewa Baru (Rp) <span className="text-on-surface-variant font-normal">opsional — kosongkan jika sama</span></label>
            <input type="number" className="input" value={form.new_monthly_rent}
              onChange={(e) => setForm((f) => ({ ...f, new_monthly_rent: e.target.value }))} />
          </div>
          {err && (
            <div className="flex items-start gap-2.5 p-3 bg-error-container rounded-lg">
              <AlertCircle size={15} className="text-error shrink-0 mt-0.5" />
              <p className="text-body-sm text-error-on-container">{err}</p>
            </div>
          )}
        </form>
        <div className="px-6 py-4 border-t border-outline-variant flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button type="submit" form="renew-form" disabled={isLoading} className="btn-success flex-1">
            {isLoading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Memproses...</span> : <><RefreshCw size={15} />Perpanjang</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bill Row ──────────────────────────────────────────────────────
function BillRow({ bill, onViewDetail }: { bill: ContractBill; onViewDetail: (b: ContractBill) => void }) {
  const cfg = BILL_STATUS_CFG[bill.status] ?? BILL_STATUS_CFG.UNPAID;
  const totalPaid = bill.payments.reduce((s, p) => s + p.amount, 0);
  const daysOverdue = bill.status !== 'PAID' && bill.status !== 'WAIVED'
    ? Math.max(0, Math.floor((Date.now() - new Date(bill.due_date).getTime()) / 86400000))
    : 0;

  return (
    <tr>
      <td>
        <span className="font-mono text-label-md text-on-surface-variant">
          {MONTH_NAMES[bill.period_month - 1]} {bill.period_year}
        </span>
      </td>
      <td>{new Date(bill.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
      <td className="text-money">{fmt(bill.total_amount - bill.discount_amount)}</td>
      <td className="text-money text-secondary">{totalPaid > 0 ? fmt(totalPaid) : '—'}</td>
      <td>
        <div className="flex items-center gap-2">
          <span className={cfg.cn}>{cfg.label}</span>
          {daysOverdue > 0 && (
            <span className="flex items-center gap-1 text-body-sm text-error">
              <Clock size={12} />{daysOverdue}h
            </span>
          )}
        </div>
      </td>
      <td>
        <button onClick={() => onViewDetail(bill)} className="text-body-sm text-primary hover:underline font-semibold">
          Detail
        </button>
      </td>
    </tr>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export function ContractDetailPage() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success } = useToast();
  const [showTerminate, setShowTerminate] = useState(false);
  const [showRenew, setShowRenew] = useState(false);
  const [showConfirmTerminate, setShowConfirmTerminate] = useState(false);
  const [selectedBill, setSelectedBill] = useState<ContractBill | null>(null);

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: () => contractsApi.getById(contractId!),
    enabled: !!contractId,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
    queryClient.invalidateQueries({ queryKey: ['contracts'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['bills'] });
  };

  if (isLoading) return (
    <DashboardLayout>
      <div className="space-y-4 max-w-3xl">
        {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-lg" />)}
      </div>
    </DashboardLayout>
  );

  if (!contract) return (
    <DashboardLayout>
      <div className="card p-12 text-center max-w-md mx-auto">
        <AlertCircle size={40} className="mx-auto text-error mb-3" />
        <p className="text-body-md text-on-surface-variant">Kontrak tidak ditemukan</p>
        <button onClick={() => navigate('/contracts')} className="btn-secondary mt-4 mx-auto">Kembali</button>
      </div>
    </DashboardLayout>
  );

  const cfg = CONTRACT_STATUS_CFG[contract.status] ?? CONTRACT_STATUS_CFG.PENDING;
  const bills = (contract as unknown as { bills?: ContractBill[] }).bills ?? [];
  const paidBills = bills.filter((b) => b.status === 'PAID').length;
  const unpaidBills = bills.filter((b) => b.status === 'UNPAID' || b.status === 'PARTIALLY_PAID').length;
  const isTerminable = contract.status === 'ACTIVE';
  const isRenewable = contract.status === 'ACTIVE' || contract.status === 'EXPIRED';

  return (
    <>
      <DashboardLayout
        title="Detail Kontrak"
        subtitle={`${contract.tenant.full_name} — ${contract.room.property.name}`}
        action={
          <div className="flex items-center gap-2">
            {isRenewable && (
              <button onClick={() => setShowRenew(true)} className="btn-secondary">
                <RefreshCw size={15} />Perpanjang
              </button>
            )}
            {isTerminable && (
              <button onClick={() => setShowConfirmTerminate(true)} className="btn-danger">
                <XCircle size={15} />Terminasi
              </button>
            )}
          </div>
        }
      >
        <button onClick={() => navigate('/contracts')}
          className="flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-on-surface mb-5 transition-colors">
          <ArrowLeft size={15} />Kembali ke Kontrak
        </button>

        <div className="max-w-3xl space-y-5 animate-fade-in">
          {/* Info card */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <h2 className="text-body-lg font-bold text-on-surface">Informasi Kontrak</h2>
              <span className={cfg.cn}>{cfg.label}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User size={15} className="text-on-surface-variant shrink-0 mt-0.5" />
                  <div>
                    <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-0.5">Penghuni</p>
                    <p className="font-semibold text-on-surface">{contract.tenant.full_name}</p>
                    <p className="text-body-sm text-on-surface-variant">{contract.tenant.email}</p>
                    {contract.tenant.phone_number && <p className="text-body-sm text-on-surface-variant">{contract.tenant.phone_number}</p>}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 size={15} className="text-on-surface-variant shrink-0 mt-0.5" />
                  <div>
                    <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-0.5">Kamar</p>
                    <p className="font-semibold text-on-surface">{contract.room.property.name}</p>
                    <p className="text-body-sm text-on-surface-variant">Kamar {contract.room.room_number}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar size={15} className="text-on-surface-variant shrink-0 mt-0.5" />
                  <div>
                    <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-0.5">Periode</p>
                    <p className="text-body-md text-on-surface">{fmtDate(contract.start_date)}</p>
                    <p className="text-body-sm text-on-surface-variant">s/d {fmtDate(contract.end_date)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Receipt size={15} className="text-on-surface-variant shrink-0 mt-0.5" />
                  <div>
                    <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-0.5">Sewa & Deposit</p>
                    <p className="text-money font-semibold text-on-surface">{fmt(contract.monthly_rent)}<span className="text-on-surface-variant font-normal font-sans text-body-sm">/bln</span></p>
                    <p className="text-body-sm text-on-surface-variant">
                      Deposit: {fmt(contract.deposit_amount)} ({contract.deposit_status === 'PAID' ? 'Lunas' : contract.deposit_status === 'REFUNDED' ? 'Dikembalikan' : 'Belum Lunas'})
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {contract.termination_reason && (
              <div className="mt-4 p-3 bg-error-container rounded-lg">
                <p className="text-body-sm text-error-on-container"><span className="font-semibold">Alasan terminasi:</span> {contract.termination_reason}</p>
              </div>
            )}
            {contract.notes && (
              <div className="mt-4 pt-4 border-t border-outline-variant/50">
                <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-1.5">Catatan</p>
                <p className="text-body-sm text-on-surface">{contract.notes}</p>
              </div>
            )}
          </div>

          {/* Bill stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Tagihan', value: bills.length, color: 'text-on-surface' },
              { label: 'Sudah Lunas', value: paidBills, color: 'text-secondary', icon: CheckCircle2 },
              { label: 'Belum Lunas', value: unpaidBills, color: unpaidBills > 0 ? 'text-error' : 'text-on-surface', icon: Clock },
            ].map(({ label, value, color }) => (
              <div key={label} className="card p-4 text-center">
                <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
                <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Bills table */}
          {bills.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-outline-variant">
                <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest">Riwayat Tagihan</p>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Periode</th>
                      <th>Jatuh Tempo</th>
                      <th>Jumlah</th>
                      <th>Dibayar</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((b) => <BillRow key={b.id} bill={b} onViewDetail={setSelectedBill} />)}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>

      {showConfirmTerminate && (
        <ConfirmDialog
          title="Terminasi Kontrak?"
          description="Kontrak akan diakhiri, tagihan belum jatuh tempo akan dibatalkan, dan kamar akan dikosongkan. Tindakan ini tidak bisa dibatalkan."
          confirmLabel="Ya, Terminasi"
          variant="danger"
          onConfirm={() => { setShowConfirmTerminate(false); setShowTerminate(true); }}
          onCancel={() => setShowConfirmTerminate(false)}
        />
      )}

      {showTerminate && (
        <TerminateModal
          contractId={contract.id}
          onClose={() => setShowTerminate(false)}
          onSuccess={() => { success('Kontrak berhasil diterminasi'); refresh(); }}
        />
      )}

      {showRenew && (
        <RenewModal
          contract={contract}
          onClose={() => setShowRenew(false)}
          onSuccess={refresh}
        />
      )}

      {selectedBill && (
        <ContractBillDetailModal
          bill={selectedBill}
          contract={contract}
          onClose={() => setSelectedBill(null)}
          onSuccess={refresh}
        />
      )}
    </>
  );
}

// ── Contract Bill Detail Modal ────────────────────────────────────
function ContractBillDetailModal({
  bill,
  contract,
  onClose,
  onSuccess,
}: {
  bill: ContractBill;
  contract: Contract;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { success, error: toastError } = useToast();
  const { data, refetch } = useQuery({
    queryKey: ['bill-payments', bill.id],
    queryFn: () => billsApi.getPayments(bill.id),
  });

  const payments: Payment[] = (data as { payments?: Payment[] })?.payments ?? [];
  const totalPaid = (data as { total_paid?: number })?.total_paid ?? 0;
  const remainingAmount = bill.total_amount - bill.discount_amount - totalPaid;

  const [showPayForm, setShowPayForm] = useState(false);
  const [amount, setAmount] = useState(String(remainingAmount));
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [refNumber, setRefNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await billsApi.recordPayment(bill.id, {
        idempotency_key: `pay-${bill.id}-${Date.now()}`,
        amount: Number(amount),
        payment_method: method,
        payment_date: new Date().toISOString().split('T')[0],
        reference_number: refNumber || undefined,
      });
      success('Pembayaran berhasil dicatat');
      setShowPayForm(false);
      refetch();
      onSuccess();
    } catch (err: unknown) {
      toastError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Gagal mencatat pembayaran'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-modal w-full max-w-md animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant shrink-0">
          <div>
            <h2 className="text-headline-sm font-bold text-on-surface">Detail Tagihan</h2>
            <p className="text-body-sm text-on-surface-variant">
              Kamar {contract.room.room_number} · {MONTH_NAMES[bill.period_month - 1]} {bill.period_year}
            </p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3 text-body-sm">
            <div>
              <p className="text-on-surface-variant">Tagihan Pokok</p>
              <p className="font-semibold text-on-surface text-money">{fmt(bill.base_rent)}</p>
            </div>
            <div>
              <p className="text-on-surface-variant">Diskon</p>
              <p className="font-semibold text-secondary text-money">
                {bill.discount_amount > 0 ? `-${fmt(bill.discount_amount)}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-on-surface-variant">Total Tagihan</p>
              <p className="font-bold text-on-surface text-money">
                {fmt(bill.total_amount - bill.discount_amount)}
              </p>
            </div>
            <div>
              <p className="text-on-surface-variant">Sudah Dibayar</p>
              <p className="font-semibold text-secondary text-money">{fmt(totalPaid)}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-outline-variant/50">
            <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">Riwayat Pembayaran</p>
            {payments.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant text-center py-3">Belum ada pembayaran</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-outline-variant/30 last:border-0 text-body-sm">
                    <div>
                      <p className="font-medium text-on-surface text-money">{fmt(p.amount)}</p>
                      <p className="text-on-surface-variant">
                        {new Date(p.payment_date ?? (p as any).paymentDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} · {p.payment_method ?? (p as any).paymentMethod}
                      </p>
                    </div>
                    {(p.reference_number ?? (p as any).referenceNumber) && (
                      <span className="font-mono text-label-sm text-on-surface-variant">
                        {p.reference_number ?? (p as any).referenceNumber}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {showPayForm ? (
            <form onSubmit={handleRecordPayment} className="pt-4 border-t border-outline-variant/50 space-y-3">
              <p className="font-semibold text-body-md text-on-surface">Catat Pembayaran Baru</p>
              <div>
                <label className="label">Jumlah Pembayaran (Rp)</label>
                <input
                  type="number"
                  className="input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  max={remainingAmount}
                  required
                />
              </div>
              <div>
                <label className="label">Metode</label>
                <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="BANK_TRANSFER">Transfer Bank</option>
                  <option value="CASH">Tunai</option>
                  <option value="EWALLET">E-Wallet</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="label">Nomor Referensi (opsional)</label>
                <input
                  className="input"
                  placeholder="TRF..."
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayForm(false)}
                  className="btn-secondary flex-1 py-1.5"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-success flex-1 py-1.5"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          ) : (
            remainingAmount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setAmount(String(remainingAmount));
                  setShowPayForm(true);
                }}
                className="btn-primary w-full py-2 mt-2"
              >
                Catat Pembayaran Baru ({fmt(remainingAmount)})
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
