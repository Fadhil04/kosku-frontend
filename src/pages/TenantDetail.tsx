import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tenantsApi } from '../api/tenants';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  ArrowLeft, Mail, Phone, IdCard, User, AlertCircle, X,
  Pencil, Building2, Calendar, ChevronRight,
} from 'lucide-react';
import type { Tenant, TenantContract } from '../types';

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const CONTRACT_STATUS: Record<string, { label: string; cn: string }> = {
  ACTIVE:     { label: 'Aktif',       cn: 'bg-secondary-container text-secondary-on-container' },
  PENDING:    { label: 'Pending',     cn: 'bg-primary-fixed text-primary-container' },
  TERMINATED: { label: 'Diterminasi', cn: 'bg-error-container text-error-on-container' },
  EXPIRED:    { label: 'Berakhir',    cn: 'bg-surface-container text-on-surface-variant' },
};

// ── Edit Tenant Modal ─────────────────────────────────────────────
function EditTenantModal({
  tenant,
  onClose,
  onSuccess,
}: {
  tenant: Tenant;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    full_name: tenant.full_name,
    phone_number: tenant.phone_number ?? '',
    id_card_number: tenant.id_card_number ?? '',
    emergency_contact_name: tenant.emergency_contact_name ?? '',
    emergency_contact_phone: tenant.emergency_contact_phone ?? '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await tenantsApi.update(tenant.id, {
        full_name: form.full_name,
        phone_number: form.phone_number || undefined,
        id_card_number: form.id_card_number || undefined,
        emergency_contact_name: form.emergency_contact_name || undefined,
        emergency_contact_phone: form.emergency_contact_phone || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal memperbarui data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-modal w-full max-w-md animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant shrink-0">
          <div>
            <h2 className="text-headline-sm font-bold text-on-surface">Edit Penghuni</h2>
            <p className="text-body-sm text-on-surface-variant mt-0.5">{tenant.email}</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>
        <form id="edit-tenant-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="label">Nama Lengkap</label>
            <input className="input" value={form.full_name} onChange={set('full_name')} required />
          </div>
          <div>
            <label className="label">Nomor HP <span className="text-on-surface-variant font-normal">opsional</span></label>
            <input className="input" placeholder="08123456789" value={form.phone_number} onChange={set('phone_number')} />
          </div>
          <div>
            <label className="label">Nomor KTP <span className="text-on-surface-variant font-normal">16 digit, opsional</span></label>
            <input className="input" placeholder="3271..." maxLength={16} value={form.id_card_number} onChange={set('id_card_number')} />
          </div>
          <div className="pt-1 border-t border-outline-variant">
            <p className="text-body-sm font-semibold text-on-surface mb-3">Kontak Darurat <span className="text-on-surface-variant font-normal">(opsional)</span></p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nama</label>
                <input className="input" value={form.emergency_contact_name} onChange={set('emergency_contact_name')} />
              </div>
              <div>
                <label className="label">Nomor HP</label>
                <input className="input" value={form.emergency_contact_phone} onChange={set('emergency_contact_phone')} />
              </div>
            </div>
          </div>
          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-error-container rounded-lg">
              <AlertCircle size={15} className="text-error shrink-0 mt-0.5" />
              <p className="text-body-sm text-error-on-container">{error}</p>
            </div>
          )}
        </form>
        <div className="px-6 py-4 border-t border-outline-variant flex gap-3 shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button type="submit" form="edit-tenant-form" disabled={isLoading} className="btn-primary flex-1">
            {isLoading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menyimpan...</span> : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Contract History Row ──────────────────────────────────────────
function ContractRow({ contract }: { contract: TenantContract }) {
  const cfg = CONTRACT_STATUS[contract.status] ?? CONTRACT_STATUS.EXPIRED;
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-outline-variant/50 last:border-0">
      <div className="flex items-start gap-3">
        <Building2 size={15} className="text-on-surface-variant shrink-0 mt-0.5" />
        <div>
          <p className="text-body-md font-medium text-on-surface">{contract.room.property.name} — Kamar {contract.room.room_number}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Calendar size={12} className="text-on-surface-variant" />
            <p className="text-body-sm text-on-surface-variant">
              {fmtDate(contract.start_date)} — {fmtDate(contract.end_date)}
            </p>
          </div>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <span className={`badge ${cfg.cn}`}>{cfg.label}</span>
        <p className="text-money text-body-sm text-on-surface-variant mt-1">{fmt(contract.monthly_rent)}/bln</p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export function TenantDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);

  const { data: tenant, isLoading, isError } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => tenantsApi.getById(tenantId!),
    enabled: !!tenantId,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['tenants'] });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-5 max-w-2xl">
          <div className="skeleton h-8 w-40 rounded" />
          <div className="skeleton h-40 rounded-lg" />
          <div className="skeleton h-48 rounded-lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !tenant) {
    return (
      <DashboardLayout>
        <div className="card p-12 text-center max-w-md mx-auto">
          <AlertCircle size={40} className="mx-auto text-error mb-3" />
          <p className="text-body-md text-on-surface-variant">Data penghuni tidak ditemukan</p>
          <button onClick={() => navigate('/tenants')} className="btn-secondary mt-4 mx-auto">Kembali</button>
        </div>
      </DashboardLayout>
    );
  }

  const contracts = tenant.contracts ?? [];
  const activeContract = contracts.find((c) => c.status === 'ACTIVE');

  const initials = tenant.full_name
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <DashboardLayout
        title={tenant.full_name}
        subtitle="Detail informasi penghuni"
        action={
          <button onClick={() => setShowEdit(true)} className="btn-secondary">
            <Pencil size={15} />
            Edit Data
          </button>
        }
      >
        {/* Back */}
        <button
          onClick={() => navigate('/tenants')}
          className="flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-on-surface mb-5 transition-colors"
        >
          <ArrowLeft size={15} />
          Kembali ke Penghuni
        </button>

        <div className="max-w-2xl space-y-5 animate-fade-in">
          {/* Profile card */}
          <div className="card p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
                <span className="font-mono text-headline-sm text-primary-container font-bold">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-headline-sm font-bold text-on-surface">{tenant.full_name}</h2>
                <span className={`badge mt-1.5 ${tenant.is_active ? 'bg-secondary-container text-secondary-on-container' : 'bg-surface-container text-on-surface-variant'}`}>
                  {tenant.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>

            {/* Contact info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail size={15} className="text-on-surface-variant shrink-0" />
                <span className="text-body-md text-on-surface">{tenant.email}</span>
              </div>
              {tenant.phone_number && (
                <div className="flex items-center gap-3">
                  <Phone size={15} className="text-on-surface-variant shrink-0" />
                  <span className="text-body-md text-on-surface">{tenant.phone_number}</span>
                </div>
              )}
              {tenant.id_card_number && (
                <div className="flex items-center gap-3">
                  <IdCard size={15} className="text-on-surface-variant shrink-0" />
                  <span className="font-mono text-label-md text-on-surface">{tenant.id_card_number}</span>
                </div>
              )}
              {(tenant.emergency_contact_name || tenant.emergency_contact_phone) && (
                <div className="flex items-start gap-3 pt-3 border-t border-outline-variant/50">
                  <User size={15} className="text-on-surface-variant shrink-0 mt-0.5" />
                  <div>
                    <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-1">Kontak Darurat</p>
                    <p className="text-body-md text-on-surface">{tenant.emergency_contact_name ?? '—'}</p>
                    {tenant.emergency_contact_phone && (
                      <p className="text-body-sm text-on-surface-variant">{tenant.emergency_contact_phone}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active contract highlight */}
          {activeContract && (
            <div className="card p-5 border-l-4 border-secondary">
              <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-3">Kontrak Aktif</p>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-on-surface text-body-lg">{activeContract.room.property.name} — Kamar {activeContract.room.room_number}</p>
                  <p className="text-body-sm text-on-surface-variant mt-0.5">
                    {fmtDate(activeContract.start_date)} — {fmtDate(activeContract.end_date)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-money text-body-lg font-semibold text-on-surface">{fmt(activeContract.monthly_rent)}</p>
                  <p className="text-body-sm text-on-surface-variant">per bulan</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/contracts')}
                className="mt-3 flex items-center gap-1 text-body-sm text-secondary hover:underline"
              >
                Lihat di halaman kontrak <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Contract history */}
          <div className="card p-5">
            <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-4">
              Riwayat Kontrak ({contracts.length})
            </p>
            {contracts.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant text-center py-4">Belum ada kontrak</p>
            ) : (
              <div>
                {contracts.map((c) => <ContractRow key={c.id} contract={c} />)}
              </div>
            )}
          </div>

          {/* Meta */}
          <p className="text-body-sm text-on-surface-variant px-1">
            Terdaftar sejak {fmtDate(tenant.created_at)}
          </p>
        </div>
      </DashboardLayout>

      {showEdit && tenant && (
        <EditTenantModal
          tenant={tenant}
          onClose={() => setShowEdit(false)}
          onSuccess={refresh}
        />
      )}
    </>
  );
}
