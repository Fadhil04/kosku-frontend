import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { propertiesApi } from '../api/properties';
import { DashboardLayout } from '../components/DashboardLayout';
import { useToast } from '../components/Toast';
import {
  Building2,
  MapPin,
  ChevronRight,
  Plus,
  AlertCircle,
  BedDouble,
  TrendingUp,
  X,
} from 'lucide-react';

// ── Add Property Modal ───────────────────────────────────────────
function AddPropertyModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
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
      await propertiesApi.create(form);
      success('Properti berhasil ditambahkan');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal menambahkan properti';
      setError(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-modal w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <div>
            <h2 className="text-headline-sm font-bold text-on-surface">Tambah Properti</h2>
            <p className="text-body-sm text-on-surface-variant mt-0.5">Daftarkan properti baru ke portofolio kamu</p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Nama Properti</label>
            <input
              className="input"
              placeholder="Kos Pak Budi"
              value={form.name}
              onChange={set('name')}
              required
            />
          </div>
          <div>
            <label className="label">Alamat</label>
            <input
              className="input"
              placeholder="Jl. Merpati No. 12"
              value={form.address}
              onChange={set('address')}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Kota</label>
              <input
                className="input"
                placeholder="Tangerang"
                value={form.city}
                onChange={set('city')}
                required
              />
            </div>
            <div>
              <label className="label">Provinsi</label>
              <input
                className="input"
                placeholder="Banten"
                value={form.province}
                onChange={set('province')}
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-error-container rounded-lg">
              <AlertCircle size={15} className="text-error shrink-0 mt-0.5" />
              <p className="text-body-sm text-error-on-container">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1"
            >
              {isLoading ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                'Simpan Properti'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Property Card ────────────────────────────────────────────────
function PropertyCard({ property }: { property: { id: string; name: string; address: string; city: string; province: string; stats: { total_rooms: number; occupied_rooms: number; available_rooms: number; occupancy_rate: number; unpaid_bills_count: number } } }) {
  const rate = property.stats.occupancy_rate;
  const hasUnpaid = property.stats.unpaid_bills_count > 0;

  return (
    <Link to={`/properties/${property.id}`}>
      <div className="card-hover group">
        {/* Card header — accent strip */}
        <div className="h-1.5 rounded-t-lg bg-primary" />

        <div className="p-5">
          {/* Title row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-primary-fixed flex items-center justify-center shrink-0">
                <Building2 size={16} className="text-primary-container" />
              </div>
              <div className="min-w-0">
                <h3 className="text-body-lg font-bold text-on-surface truncate">{property.name}</h3>
                <div className="flex items-center gap-1 text-on-surface-variant mt-0.5">
                  <MapPin size={12} className="shrink-0" />
                  <p className="text-body-sm truncate">{property.city}, {property.province}</p>
                </div>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-outline shrink-0 mt-1 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
            />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-surface-container-low rounded-lg p-2.5 text-center">
              <p className="text-body-lg font-bold text-on-surface tabular-nums">
                {property.stats.total_rooms}
              </p>
              <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider">
                Total
              </p>
            </div>
            <div className="bg-primary-fixed/50 rounded-lg p-2.5 text-center">
              <p className="text-body-lg font-bold text-primary-container tabular-nums">
                {property.stats.occupied_rooms}
              </p>
              <p className="font-mono text-label-sm text-primary-container/70 uppercase tracking-wider">
                Terisi
              </p>
            </div>
            <div className="bg-secondary-container/40 rounded-lg p-2.5 text-center">
              <p className="text-body-lg font-bold text-secondary tabular-nums">
                {property.stats.available_rooms}
              </p>
              <p className="font-mono text-label-sm text-secondary/70 uppercase tracking-wider">
                Tersedia
              </p>
            </div>
          </div>

          {/* Occupancy bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={13} className="text-on-surface-variant" />
                <span className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Hunian
                </span>
              </div>
              <span className={`font-mono text-label-md font-bold ${
                rate >= 80 ? 'text-secondary' : rate >= 60 ? 'text-tertiary-on-container' : 'text-error'
              }`}>
                {rate}%
              </span>
            </div>
            <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  rate >= 80 ? 'bg-secondary' : rate >= 60 ? 'bg-tertiary-on-container' : 'bg-error'
                }`}
                style={{ width: `${rate}%` }}
              />
            </div>
          </div>

          {/* Unpaid bills alert */}
          {hasUnpaid && (
            <div className="mt-3 flex items-center gap-2 px-2.5 py-1.5 bg-error-container rounded-lg">
              <AlertCircle size={13} className="text-error shrink-0" />
              <p className="text-body-sm text-error-on-container">
                {property.stats.unpaid_bills_count} tagihan belum lunas
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Add Card ─────────────────────────────────────────────────────
function AddPropertyCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group border-2 border-dashed border-outline-variant rounded-lg flex flex-col items-center justify-center p-8 min-h-[280px] hover:border-primary hover:bg-primary-fixed/20 transition-all"
    >
      <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-4 group-hover:bg-primary-fixed group-hover:scale-110 transition-all">
        <Plus size={24} className="text-outline group-hover:text-primary-container" />
      </div>
      <p className="text-body-md font-semibold text-on-surface-variant group-hover:text-primary">
        Tambah Properti
      </p>
      <p className="text-body-sm text-on-surface-variant/70 text-center mt-1 max-w-[160px]">
        Daftarkan properti baru ke portofolio
      </p>
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export function PropertiesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: propertiesApi.getAll,
  });

  const properties = data?.data ?? [];

  return (
    <>
      <DashboardLayout
        title="Properti"
        subtitle="Kelola semua aset properti kamu"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            <Plus size={16} />
            Tambah Properti
          </button>
        }
      >
        {/* Summary bar */}
        {!isLoading && properties.length > 0 && (
          <div className="flex items-center gap-6 mb-6 px-1">
            <div className="flex items-center gap-2">
              <BedDouble size={15} className="text-on-surface-variant" />
              <span className="text-body-sm text-on-surface-variant">
                <span className="font-semibold text-on-surface">{properties.length}</span> properti
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-body-sm text-on-surface-variant">
                <span className="font-semibold text-on-surface">
                  {properties.reduce((s, p) => s + p.stats.total_rooms, 0)}
                </span> total kamar
              </span>
            </div>
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5">
                <div className="skeleton h-5 w-40 mb-3 rounded" />
                <div className="skeleton h-4 w-28 mb-5 rounded" />
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="skeleton h-16 rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
            <AddPropertyCard onClick={() => setShowModal(true)} />
          </div>
        )}
      </DashboardLayout>

      {showModal && (
        <AddPropertyModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['properties'] });
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}
