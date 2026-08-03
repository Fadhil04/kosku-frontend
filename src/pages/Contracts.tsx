import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { contractsApi } from '../api/contracts';
import { tenantsApi } from '../api/tenants';
import { propertiesApi } from '../api/properties';
import { roomsApi } from '../api/room';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  FileText, Plus, X, AlertCircle, ChevronDown,
  User, Building2, Clock,
} from 'lucide-react';
import type { Contract, Property, Room, Tenant } from '../types';

// ── Status config ────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; cn: string }> = {
  ACTIVE:     { label: 'Aktif',      cn: 'badge bg-secondary-container text-secondary-on-container' },
  PENDING:    { label: 'Pending',    cn: 'badge bg-primary-fixed text-primary-container' },
  TERMINATED: { label: 'Diterminasi', cn: 'badge bg-error-container text-error-on-container' },
  EXPIRED:    { label: 'Berakhir',   cn: 'badge bg-surface-container text-on-surface-variant' },
};

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

// ── Days remaining ────────────────────────────────────────────────
function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

// ── Add Contract Modal ────────────────────────────────────────────
function AddContractModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: tenantsData } = useQuery({ queryKey: ['tenants-all'], queryFn: () => tenantsApi.getAll({ limit: 100 }) });
  const { data: propertiesData } = useQuery({ queryKey: ['properties'], queryFn: propertiesApi.getAll });

  const tenants: Tenant[] = tenantsData?.data ?? [];
  const properties: Property[] = propertiesData?.data ?? [];

  const { data: roomsData } = useQuery({
    queryKey: ['rooms', form.property_id],
    queryFn: () => roomsApi.getAll(form.property_id),
    enabled: !!form.property_id,
  });
  const availableRooms = (roomsData?.data ?? []).filter((r: Room) => r.status === 'AVAILABLE');

  // Auto-fill monthly_rent when room selected
  const onRoomChange = (roomId: string) => {
    const room = availableRooms.find((r: Room) => r.id === roomId);
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
        notes: form.notes || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal membuat kontrak',
      );
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
              Sistem akan otomatis generate semua tagihan
            </p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {/* Tenant */}
          <div>
            <label className="label">Penghuni</label>
            <div className="relative">
              <select
                className="input appearance-none pr-8"
                value={form.tenant_id}
                onChange={(e) => setForm((f) => ({ ...f, tenant_id: e.target.value }))}
                required
              >
                <option value="">Pilih penghuni...</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.full_name} — {t.email}</option>
                ))}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
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
              >
                <option value="">Pilih properti...</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
          </div>

          {/* Room */}
          <div>
            <label className="label">Kamar <span className="text-on-surface-variant font-normal">(hanya kamar tersedia)</span></label>
            <div className="relative">
              <select
                className="input appearance-none pr-8"
                value={form.room_id}
                onChange={(e) => onRoomChange(e.target.value)}
                required
                disabled={!form.property_id}
              >
                <option value="">
                  {form.property_id ? `${availableRooms.length} kamar tersedia` : 'Pilih properti dulu'}
                </option>
                {availableRooms.map((r: Room) => (
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
              <input type="date" className="input" value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Tanggal Selesai</label>
              <input type="date" className="input" value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} required />
            </div>
          </div>

          {/* Rent + Deposit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Harga Sewa/Bulan (Rp)</label>
              <input type="number" className="input" placeholder="1500000"
                value={form.monthly_rent}
                onChange={(e) => setForm((f) => ({ ...f, monthly_rent: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Deposit (Rp) <span className="text-on-surface-variant font-normal">opsional</span></label>
              <input type="number" className="input" placeholder="0"
                value={form.deposit_amount}
                onChange={(e) => setForm((f) => ({ ...f, deposit_amount: e.target.value }))} />
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

          {/* Notes */}
          <div>
            <label className="label">Catatan <span className="text-on-surface-variant font-normal">opsional</span></label>
            <input className="input" placeholder="Catatan tambahan kontrak..."
              value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
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
            onClick={(e) => { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent); }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Membuat...
              </span>
            ) : 'Buat Kontrak'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Contract Row ──────────────────────────────────────────────────
function ContractRow({ contract }: { contract: Contract }) {
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
        <p className="text-money text-on-surface">{fmt(contract.monthly_rent)}<span className="text-on-surface-variant font-normal font-sans text-body-sm">/bln</span></p>
      </td>
      <td>
        <div className="text-body-sm text-on-surface-variant space-y-0.5">
          <p>{fmtDate(contract.start_date)}</p>
          <p className="text-body-sm text-on-surface-variant">s/d {fmtDate(contract.end_date)}</p>
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
    </tr>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export function ContractsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['contracts', statusFilter],
    queryFn: () => contractsApi.getAll({ status: statusFilter || undefined }),
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
              { key: 'ACTIVE',     label: 'Aktif',      cn: 'bg-secondary-container text-secondary-on-container' },
              { key: 'PENDING',    label: 'Pending',     cn: 'bg-primary-fixed text-primary-container' },
              { key: 'TERMINATED', label: 'Diterminasi', cn: 'bg-error-container text-error-on-container' },
              { key: 'EXPIRED',    label: 'Berakhir',    cn: 'bg-surface-container text-on-surface-variant' },
            ].map(({ key, label, cn }) =>
              counts[key] ? (
                <button
                  key={key}
                  onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-body-sm font-medium transition-all ${cn} ${statusFilter === key ? 'ring-2 ring-offset-1 ring-current' : 'opacity-75 hover:opacity-100'}`}
                >
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
                    <th>Properti & Kamar</th>
                    <th>Harga Sewa</th>
                    <th>Periode</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c) => (
                    <ContractRow key={c.id} contract={c} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DashboardLayout>

      {showModal && (
        <AddContractModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          }}
        />
      )}
    </>
  );
}
