import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { tenantsApi } from '../api/tenants';
import { DashboardLayout } from '../components/DashboardLayout';
import { useToast } from '../components/Toast';
import {
  Users, Plus, X, AlertCircle, Phone, Mail,
  IdCard, UserCheck, Building2, Info, ChevronRight, CheckCircle2,
} from 'lucide-react';
import type { Tenant } from '../types';

// ── Add Tenant Modal ──────────────────────────────────────────────
function AddTenantModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (data: { id: string; temp_password?: string }) => void }) {
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    id_card_number: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
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
      const result = await tenantsApi.create({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number?.trim() || undefined,
        id_card_number: form.id_card_number?.trim() || undefined,
        emergency_contact_name: form.emergency_contact_name?.trim() || undefined,
        emergency_contact_phone: form.emergency_contact_phone?.trim() || undefined,
      });
      success('Penghuni berhasil ditambahkan');
      onSuccess({
        id: result?.id ?? '',
        temp_password: (result as { temp_password?: string })?.temp_password,
      });
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal menambahkan penghuni';
      setError(msg);
      toastError(msg);
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
      <div className="relative bg-white rounded-lg shadow-modal w-full max-w-md animate-slide-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant shrink-0">
          <div>
            <h2 className="text-headline-sm font-bold text-on-surface">Tambah Penghuni</h2>
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              Password sementara akan dikirim ke email penghuni
            </p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>

        {/* Info banner */}
        <div className="mx-6 mt-4 flex items-start gap-2.5 p-3 bg-primary-fixed rounded-lg shrink-0">
          <Info size={14} className="text-primary-container shrink-0 mt-0.5" />
          <p className="text-body-sm text-primary-container">
            Sistem akan otomatis generate password sementara dan mengirimkannya ke email penghuni.
          </p>
        </div>

        {/* Body */}
        <form
          id="add-tenant-form"
          onSubmit={handleSubmit}
          className="px-6 py-5 space-y-4 overflow-y-auto flex-1"
        >
          <div>
            <label className="label">Nama Lengkap</label>
            <input
              className="input"
              placeholder="Budi Santoso"
              value={form.full_name}
              onChange={set('full_name')}
              required
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="budi@email.com"
              value={form.email}
              onChange={set('email')}
              required
            />
          </div>

          <div>
            <label className="label">
              Nomor HP{' '}
              <span className="text-on-surface-variant font-normal">opsional</span>
            </label>
            <input
              className="input"
              placeholder="08123456789"
              value={form.phone_number}
              onChange={set('phone_number')}
            />
          </div>

          <div>
            <label className="label">
              Nomor KTP{' '}
              <span className="text-on-surface-variant font-normal">16 digit, opsional</span>
            </label>
            <input
              className="input"
              placeholder="3271010101010001"
              maxLength={16}
              value={form.id_card_number}
              onChange={set('id_card_number')}
            />
          </div>

          <div className="pt-1 border-t border-outline-variant">
            <p className="text-body-sm font-semibold text-on-surface mb-3">
              Kontak Darurat{' '}
              <span className="text-on-surface-variant font-normal">(opsional)</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nama</label>
                <input
                  className="input"
                  placeholder="Ibu Santi"
                  value={form.emergency_contact_name}
                  onChange={set('emergency_contact_name')}
                />
              </div>
              <div>
                <label className="label">Nomor HP</label>
                <input
                  className="input"
                  placeholder="08987654321"
                  value={form.emergency_contact_phone}
                  onChange={set('emergency_contact_phone')}
                />
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

        {/* Footer — submit terhubung ke form via form="add-tenant-form" */}
        <div className="px-6 py-4 border-t border-outline-variant flex gap-3 shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Batal
          </button>
          <button
            type="submit"
            form="add-tenant-form"
            disabled={isLoading}
            className="btn-primary flex-1"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Menyimpan...
              </span>
            ) : (
              <>
                <UserCheck size={16} />
                Tambah Penghuni
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tenant Card ───────────────────────────────────────────────────
function TenantCard({ tenant }: { tenant: Tenant }) {
  const navigate = useNavigate();
  const name = tenant.full_name;
  const phone = tenant.phone_number;
  const ktp = tenant.id_card_number;
  const active = tenant.is_active;
  const activeContract = tenant.active_contract;

  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="card p-5 hover:shadow-card-hover transition-all flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
          <span className="font-mono text-label-md text-primary-container font-bold">
            {initials}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-on-surface text-body-md">{name}</p>
          <span className={`badge mt-1 ${active
            ? 'bg-secondary-container text-secondary-on-container'
            : 'bg-surface-container text-on-surface-variant'
          }`}>
            {active ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Mail size={13} className="shrink-0" />
          <span className="text-body-sm truncate">{tenant.email}</span>
        </div>
        {phone && (
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Phone size={13} className="shrink-0" />
            <span className="text-body-sm">{phone}</span>
          </div>
        )}
        {ktp && (
          <div className="flex items-center gap-2 text-on-surface-variant">
            <IdCard size={13} className="shrink-0" />
            <span className="font-mono text-label-md">{ktp}</span>
          </div>
        )}
      </div>

      {/* Active contract info */}
      {activeContract && (
        <div className="mt-3 flex items-center gap-2 px-2.5 py-2 bg-primary-fixed/50 rounded-lg">
          <Building2 size={13} className="text-primary-container shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-body-sm font-medium text-primary-container truncate">
              {activeContract.room.property.name}
            </p>
            <p className="font-mono text-label-sm text-primary-container/70">
              Kamar {activeContract.room.room_number}
            </p>
          </div>
        </div>
      )}

      {/* Footer — link ke detail */}
      <div className="mt-3 pt-3 border-t border-outline-variant/50 flex items-center justify-between">
        <p className="text-body-sm text-on-surface-variant">
          {new Date(tenant.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
        <button
          onClick={() => navigate(`/tenants/${tenant.id}`)}
          className="flex items-center gap-1 text-body-sm text-primary hover:underline font-medium"
        >
          Detail <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Empty state — penghuni belum punya kontrak ────────────────────
function EmptyNoContract({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card p-12 text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center mx-auto mb-4">
        <Users size={24} className="text-primary-container" />
      </div>
      <p className="text-body-lg font-semibold text-on-surface mb-2">Belum ada penghuni</p>
      <p className="text-body-sm text-on-surface-variant mb-5">
        Daftar penghuni hanya menampilkan penghuni yang sudah atau pernah punya kontrak
        di propertimu. Tambahkan penghuni baru, lalu buat kontrak untuk mereka.
      </p>
      <button onClick={onAdd} className="btn-primary mx-auto">
        <Plus size={16} />
        Tambah Penghuni
      </button>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export function TenantsPage() {
  const { success } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [newTenantData, setNewTenantData] = useState<{ id: string; temp_password?: string } | null>(null);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tenants', search],
    queryFn: () => tenantsApi.getAll({ limit: 50, search: search || undefined }),
  });

  const tenants: Tenant[] = data?.data ?? [];
  const total = data?.meta?.total ?? tenants.length;

  return (
    <>
      <DashboardLayout
        title="Penghuni"
        subtitle="Kelola data semua penghuni kos"
        action={
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <input
                className="input py-2 w-56 pl-9"
                placeholder="Cari nama atau email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </span>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus size={16} />
              Tambah Penghuni
            </button>
          </div>
        }
      >
        {/* Summary bar */}
        {!isLoading && tenants.length > 0 && (
          <div className="flex items-center gap-2 mb-5">
            <Users size={15} className="text-on-surface-variant" />
            <span className="text-body-sm text-on-surface-variant">
              <span className="font-semibold text-on-surface">{total}</span> penghuni
              {search && ` ditemukan untuk "${search}"`}
            </span>
          </div>
        )}

        {/* States */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card p-5">
                <div className="flex gap-3 mb-4">
                  <div className="skeleton w-10 h-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="skeleton h-4 w-32 rounded" />
                    <div className="skeleton h-5 w-14 rounded-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="skeleton h-3 w-40 rounded" />
                  <div className="skeleton h-3 w-28 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="card p-12 text-center">
            <AlertCircle size={40} className="mx-auto text-error mb-4" />
            <p className="text-body-md text-on-surface-variant">Gagal memuat data penghuni</p>
          </div>
        ) : tenants.length === 0 && !search ? (
          <EmptyNoContract onAdd={() => setShowModal(true)} />
        ) : tenants.length === 0 ? (
          <div className="card p-12 text-center">
            <Users size={40} className="mx-auto text-outline mb-4" />
            <p className="text-body-md text-on-surface-variant">
              Tidak ada penghuni dengan nama "{search}"
            </p>
            <button onClick={() => setSearch('')} className="btn-ghost mt-3 mx-auto text-body-sm">
              Hapus filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {tenants.map((t) => (
              <TenantCard key={t.id} tenant={t} />
            ))}
          </div>
        )}
      </DashboardLayout>

      {showModal && (
        <AddTenantModal
          onClose={() => setShowModal(false)}
          onSuccess={(data) => {
            queryClient.invalidateQueries({ queryKey: ['tenants'] });
            setNewTenantData(data);
          }}
        />
      )}

      {/* Prompt buat kontrak & lihat password sementara setelah tambah penghuni */}
      {newTenantData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={() => setNewTenantData(null)} />
          <div className="relative bg-white rounded-lg shadow-modal w-full max-w-sm animate-slide-up p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-secondary" />
            </div>
            <h3 className="text-body-lg font-bold text-on-surface mb-1">Penghuni berhasil ditambahkan!</h3>
            
            {newTenantData.temp_password && (
              <div className="my-3 p-3 bg-surface-container-low rounded-lg border border-outline-variant text-left">
                <p className="text-body-sm text-on-surface-variant font-medium">Password Sementara Penghuni:</p>
                <div className="flex items-center justify-between mt-1">
                  <code className="font-mono text-body-md font-bold text-primary">{newTenantData.temp_password}</code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(newTenantData.temp_password!);
                      success('Password berhasil disalin!');
                    }}
                    className="btn-ghost btn-sm text-body-sm text-primary font-medium"
                  >
                    Salin
                  </button>
                </div>
              </div>
            )}

            <p className="text-body-sm text-on-surface-variant mb-5">
              Mau langsung buatkan kontrak untuk penghuni ini?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setNewTenantData(null)} className="btn-secondary flex-1">Nanti</button>
              <button
                onClick={() => { setNewTenantData(null); navigate('/contracts'); }}
                className="btn-primary flex-1"
              >
                Buat Kontrak
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
