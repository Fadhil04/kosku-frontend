import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/Toast';
import { Pagination } from '../components/Pagination';
import { contractsApi } from '../api/contracts';
import { tenantsApi } from '../api/tenants';
import { propertiesApi } from '../api/properties';
import { roomsApi } from '../api/room';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  FileText, Plus, X, AlertCircle, Calendar,
  ChevronDown, User, Building2, Clock, ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Contract, Property, Room, Tenant } from '../types';

// ── Helpers ──────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (s: string) => {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

function daysUntil(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

// ── Status config ────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; cn: string }> = {
  ACTIVE:     { label: 'Aktif',       cn: 'badge bg-secondary-container text-secondary-on-container' },
  PENDING:    { label: 'Pending',     cn: 'badge bg-primary-fixed text-primary-container' },
  TERMINATED: { label: 'Diterminasi', cn: 'badge bg-error-container text-error-on-container' },
  EXPIRED:    { label: 'Berakhir',    cn: 'badge bg-surface-container text-on-surface-variant' },
};

// ── Add Contract Modal ────────────────────────────────────────────
function AddContractModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState({
    tenant_id: '',
    property_id: '',
    room_id: '',
    start_date: '',
    end_date: '',
    monthly_rent: '',
    deposit_amount: '',
    billing_date: '5',
    notes: '',
  });
  const [additionalCharges, setAdditionalCharges] = useState<{ name: string; amount: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: tenantsData, isLoading: loadingTenants } = useQuery({
    queryKey: ['tenants-all'],
    queryFn: () => tenantsApi.getAll({ limit: 200 }),
    staleTime: 0, // selalu ambil terbaru saat modal dibuka
  });
  const { data: propertiesData, isLoading: loadingProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: propertiesApi.getAll,
    staleTime: 0,
  });

  const tenants: Tenant[] = tenantsData?.data ?? [];
  const properties: Property[] = propertiesData?.data ?? [];

  const { data: roomsData } = useQuery({
    queryKey: ['rooms-available', form.property_id],
    queryFn: () => roomsApi.getAvailable(form.property_id),
    enabled: !!form.property_id,
  });
  const availableRooms: Room[] = roomsData ?? [];

  const onRoomChange = (roomId: string) => {
    const room = availableRooms.find((r) => r.id === roomId);
    setForm((f) => ({
      ...f,
      room_id: roomId,
      monthly_rent: room ? String(room.base_price) : f.monthly_rent,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await contractsApi.create({
        room_id: form.room_id,
        tenant_id: form.tenant_id,
        start_date: form.start_date,
        end_date: form.end_date,
        monthly_rent: Number(form.monthly_rent),
        deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : 0,
        billing_date: Number(form.billing_date),
        additional_charges: additionalCharges
          .filter((c) => c.name.trim() && Number(c.amount) > 0)
          .map((c) => ({ name: c.name.trim(), amount: Number(c.amount) })),
        notes: form.notes || undefined,
      });
      success('Kontrak berhasil dibuat, tagihan otomatis digenerate');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal membuat kontrak';
      setError(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-modal w-full max-w-lg animate-slide-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant shrink-0">
          <div>
            <h2 className="text-headline-sm font-bold text-on-surface">Buat Kontrak Baru</h2>
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              Tagihan bulanan akan digenerate otomatis
            </p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>

        {/* Body */}
        <form id="contract-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {/* Tenant */}
          <div>
            <label className="label">Penghuni</label>
            <div className="relative">
              <select
                className="input appearance-none pr-8"
                value={form.tenant_id}
                onChange={(e) => setForm((f) => ({ ...f, tenant_id: e.target.value }))}
                required
                disabled={loadingTenants}
              >
                <option value="">
                  {loadingTenants ? 'Memuat data penghuni...' : tenants.length === 0 ? 'Belum ada penghuni — tambah dulu di menu Penghuni' : 'Pilih penghuni...'}
                </option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.full_name} — {t.email}</option>
                ))}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
            {!loadingTenants && tenants.length === 0 && (
              <p className="text-body-sm text-error mt-1.5 flex items-center gap-1">
                <AlertCircle size={13} />
                Tambahkan penghuni dulu di menu <strong>Penghuni</strong> sebelum membuat kontrak.
              </p>
            )}
          </div>

          {/* Property */}
          <div>
            <label className="label">Properti</label>
            <div className="relative">
              <select
                className="input appearance-none pr-8"
                value={form.property_id}
                onChange={(e) => setForm((f) => ({ ...f, property_id: e.target.value, room_id: '' }))}
                required
                disabled={loadingProperties}
              >
                <option value="">
                  {loadingProperties ? 'Memuat data properti...' : 'Pilih properti...'}
                </option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
          </div>

          {/* Room */}
          <div>
            <label className="label">
              Kamar <span className="text-on-surface-variant font-normal">
                {form.property_id ? `(${availableRooms.length} tersedia)` : '(pilih properti dulu)'}
              </span>
            </label>
            <div className="relative">
              <select
                className="input appearance-none pr-8"
                value={form.room_id}
                onChange={(e) => onRoomChange(e.target.value)}
                required
                disabled={!form.property_id || availableRooms.length === 0}
              >
                <option value="">
                  {!form.property_id ? 'Pilih properti dulu' : availableRooms.length === 0 ? 'Tidak ada kamar tersedia' : 'Pilih kamar...'}
                </option>
                {availableRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Kamar {r.room_number} — {r.type} — {fmt(r.base_price)}/bln
                  </option>
                ))}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tanggal Mulai</label>
              <input
                type="date"
                className="input"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Tanggal Selesai</label>
              <input
                type="date"
                className="input"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Rent + Deposit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Harga Sewa/Bulan (Rp)</label>
              <input
                type="number"
                className="input"
                placeholder="1500000"
                value={form.monthly_rent}
                onChange={(e) => setForm((f) => ({ ...f, monthly_rent: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Deposit (Rp) <span className="text-on-surface-variant font-normal">opsional</span></label>
              <input
                type="number"
                className="input"
                placeholder="0"
                value={form.deposit_amount}
                onChange={(e) => setForm((f) => ({ ...f, deposit_amount: e.target.value }))}
              />
            </div>
          </div>

          {/* Billing date */}
          <div>
            <label className="label">Tanggal Jatuh Tempo Tiap Bulan</label>
            <div className="relative">
              <select
                className="input appearance-none pr-8"
                value={form.billing_date}
                onChange={(e) => setForm((f) => ({ ...f, billing_date: e.target.value }))}
              >
                {[1, 5, 10, 15, 20, 25, 28].map((d) => (
                  <option key={d} value={d}>Tanggal {d}</option>
                ))}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
          </div>

          {/* Additional Charges */}
          <div className="pt-2 border-t border-outline-variant">
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Biaya Tambahan Bulanan <span className="text-on-surface-variant font-normal">(opsional)</span></label>
              <button
                type="button"
                onClick={() => setAdditionalCharges((prev) => [...prev, { name: '', amount: '' }])}
                className="text-body-sm text-primary font-medium hover:underline flex items-center gap-1"
              >
                + Tambah Biaya
              </button>
            </div>
            {additionalCharges.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <input
                  className="input flex-1"
                  placeholder="Nama (misal: Listrik/Air)"
                  value={item.name}
                  onChange={(e) => {
                    const next = [...additionalCharges];
                    next[idx].name = e.target.value;
                    setAdditionalCharges(next);
                  }}
                />
                <input
                  type="number"
                  className="input flex-1"
                  placeholder="Jumlah (Rp)"
                  value={item.amount}
                  onChange={(e) => {
                    const next = [...additionalCharges];
                    next[idx].amount = e.target.value;
                    setAdditionalCharges(next);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setAdditionalCharges((prev) => prev.filter((_, i) => i !== idx))}
                  className="btn-icon text-error shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="label">Catatan <span className="text-on-surface-variant font-normal">opsional</span></label>
            <input
              className="input"
              placeholder="Catatan tambahan..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-error-container rounded-lg">
              <AlertCircle size={15} className="text-error shrink-0 mt-0.5" />
              <p className="text-body-sm text-error-on-container">{error}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant flex gap-3 shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button
            type="submit"
            form="contract-form"
            disabled={isLoading}
            className="btn-primary flex-1"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Membuat...
              </span>
            ) : (
              <><Plus size={15} />Buat Kontrak</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Contract Row ──────────────────────────────────────────────────
function ContractRow({ contract }: { contract: Contract }) {
  const navigate = useNavigate();
  const cfg = STATUS_CFG[contract.status] ?? STATUS_CFG.PENDING;
  const days = daysUntil(contract.end_date);
  const isExpiringSoon = contract.status === 'ACTIVE' && days > 0 && days <= 30;
  const isOverdue = contract.status === 'ACTIVE' && days < 0;

  return (
    <tr>
      <td>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
            <User size={13} className="text-primary-container" />
          </div>
          <div>
            <p className="font-medium text-on-surface">{contract.tenant.full_name}</p>
            <p className="text-body-sm text-on-surface-variant">{contract.tenant.email}</p>
          </div>
        </div>
      </td>
      <td>
        <div className="flex items-center gap-1.5">
          <Building2 size={13} className="text-on-surface-variant shrink-0" />
          <div>
            <p className="text-body-md text-on-surface">{contract.room.property.name}</p>
            <p className="font-mono text-label-sm text-on-surface-variant">Kamar {contract.room.room_number}</p>
          </div>
        </div>
      </td>
      <td>
        {/* monthly_rent sekarang sudah number karena backend sudah normalize */}
        <p className="text-money text-on-surface">
          {fmt(contract.monthly_rent)}
          <span className="text-on-surface-variant font-normal font-sans text-body-sm">/bln</span>
        </p>
      </td>
      <td>
        <div className="flex items-center gap-1.5 text-body-sm text-on-surface-variant">
          <Calendar size={13} className="shrink-0" />
          <div>
            <p>{fmtDate(contract.start_date)}</p>
            <p>s/d {fmtDate(contract.end_date)}</p>
          </div>
        </div>
      </td>
      <td>
        <div className="space-y-1.5">
          <span className={cfg.cn}>{cfg.label}</span>
          {isExpiringSoon && (
            <div className="flex items-center gap-1 text-body-sm text-tertiary-on-container">
              <Clock size={12} />
              <span>{days} hari lagi</span>
            </div>
          )}
          {isOverdue && (
            <div className="flex items-center gap-1 text-body-sm text-error">
              <AlertCircle size={12} />
              <span>Sudah berakhir</span>
            </div>
          )}
        </div>
      </td>
      <td>
        <button
          onClick={() => navigate(`/contracts/${contract.id}`)}
          className="flex items-center gap-1 text-body-sm text-primary hover:underline font-medium"
        >
          Detail <ChevronRight size={13} />
        </button>
      </td>
    </tr>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export function ContractsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['contracts', statusFilter, page],
    queryFn: () => contractsApi.getAll({ status: statusFilter || undefined, page, limit: 20 }),
  });

  const contracts: Contract[] = data?.data ?? [];

  const counts = contracts.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <DashboardLayout
        title="Kontrak"
        subtitle="Kelola semua kontrak sewa aktif dan historis"
        action={
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                className="input py-2 w-44 appearance-none pr-8"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="PENDING">Pending</option>
                <option value="TERMINATED">Diterminasi</option>
                <option value="EXPIRED">Berakhir</option>
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus size={16} />
              Buat Kontrak
            </button>
          </div>
        }
      >
        {/* Status chips */}
        {!isLoading && contracts.length > 0 && (
          <div className="flex items-center gap-2.5 mb-5 flex-wrap">
            {[
              { key: 'ACTIVE',     label: 'Aktif',       cn: 'bg-secondary-container text-secondary-on-container' },
              { key: 'PENDING',    label: 'Pending',      cn: 'bg-primary-fixed text-primary-container' },
              { key: 'TERMINATED', label: 'Diterminasi',  cn: 'bg-error-container text-error-on-container' },
              { key: 'EXPIRED',    label: 'Berakhir',     cn: 'bg-surface-container text-on-surface-variant' },
            ].map(({ key, label, cn }) =>
              counts[key] ? (
                <button
                  key={key}
                  onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-body-sm font-medium transition-all ${cn} ${statusFilter === key ? 'ring-2 ring-offset-1 ring-current' : 'opacity-75 hover:opacity-100'}`}>
                  <span className="font-mono font-bold tabular-nums">{counts[key]}</span>
                  {label}
                </button>
              ) : null,
            )}
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="card overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="px-4 py-4 border-b border-outline-variant/50 flex gap-4">
                <div className="skeleton h-4 w-36 rounded" />
                <div className="skeleton h-4 w-28 rounded" />
                <div className="skeleton h-4 flex-1 rounded" />
              </div>
            ))}
          </div>
        ) : contracts.length === 0 ? (
          <div className="card p-16 text-center">
            <FileText size={40} className="mx-auto text-outline mb-4" />
            <p className="text-body-md text-on-surface-variant">Belum ada kontrak</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4 mx-auto">
              <Plus size={16} />
              Buat Kontrak Pertama
            </button>
          </div>
        ) : (
          <div className="card overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Penghuni</th>
                    <th>Properti &amp; Kamar</th>
                    <th>Harga Sewa</th>
                    <th>Periode</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c) => (
                    <ContractRow key={c.id} contract={c} />
                  ))}
                </tbody>
              </table>
            </div>
            {data?.meta && (
              <div className="px-4 pb-2">
                <Pagination
                  page={page}
                  totalPages={data.meta.totalPages}
                  total={data.meta.total}
                  limit={20}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        )}
      </DashboardLayout>

      {showModal && (
        <AddContractModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            queryClient.invalidateQueries({ queryKey: ['properties'] });
          }}
        />
      )}
    </>
  );
}
