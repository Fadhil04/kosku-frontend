import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { propertiesApi } from '../api/properties';
import { roomsApi } from '../api/room';
import { DashboardLayout } from '../components/DashboardLayout';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import {
  ArrowLeft, MapPin, Building2, Plus, Pencil, X, AlertCircle,
  BedDouble, TrendingUp, Receipt, ChevronDown, CheckCircle2, Wrench, User, Trash2,
} from 'lucide-react';
import type { RoomStatus, RoomInProperty } from '../types';

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const ROOM_STATUS_CFG: Record<RoomStatus, { label: string; cn: string }> = {
  AVAILABLE:         { label: 'Tersedia',    cn: 'bg-secondary-container text-secondary-on-container' },
  OCCUPIED:          { label: 'Terisi',      cn: 'bg-primary-fixed text-primary-container' },
  RESERVED:          { label: 'Reservasi',   cn: 'bg-tertiary-fixed text-tertiary-container' },
  NEEDS_MAINTENANCE: { label: 'Maintenance', cn: 'bg-error-container text-error-on-container' },
};

// ── Edit Property Modal ──────────────────────────────────────────
function EditPropertyModal({
  property,
  onClose,
  onSuccess,
}: {
  property: { id: string; name: string; address: string; city: string; province: string; description?: string | null; rules?: string | null };
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: property.name,
    address: property.address,
    city: property.city,
    province: property.province,
    description: property.description ?? '',
    rules: property.rules ?? '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await propertiesApi.update(property.id, {
        name: form.name,
        address: form.address,
        city: form.city,
        province: form.province,
        description: form.description || undefined,
        rules: form.rules || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal memperbarui properti');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-modal w-full max-w-md animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant shrink-0">
          <h2 className="text-headline-sm font-bold text-on-surface">Edit Properti</h2>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>
        <form id="edit-property-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="label">Nama Properti</label>
            <input className="input" value={form.name} onChange={set('name')} required />
          </div>
          <div>
            <label className="label">Alamat</label>
            <input className="input" value={form.address} onChange={set('address')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Kota</label>
              <input className="input" value={form.city} onChange={set('city')} required />
            </div>
            <div>
              <label className="label">Provinsi</label>
              <input className="input" value={form.province} onChange={set('province')} required />
            </div>
          </div>
          <div>
            <label className="label">Deskripsi <span className="text-on-surface-variant font-normal">opsional</span></label>
            <textarea className="input min-h-[80px] resize-none" value={form.description} onChange={set('description')} />
          </div>
          <div>
            <label className="label">Peraturan <span className="text-on-surface-variant font-normal">opsional</span></label>
            <textarea className="input min-h-[80px] resize-none" value={form.rules} onChange={set('rules')} />
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
          <button type="submit" form="edit-property-form" disabled={isLoading} className="btn-primary flex-1">
            {isLoading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menyimpan...</span> : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Room Modal ───────────────────────────────────────────────
function AddRoomModal({
  propertyId,
  onClose,
  onSuccess,
}: {
  propertyId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({ room_number: '', type: 'Standard', floor: '', base_price: '', size_sqm: '', notes: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await roomsApi.create(propertyId, {
        room_number: form.room_number,
        type: form.type,
        base_price: Number(form.base_price),
        floor: form.floor ? Number(form.floor) : undefined,
        size_sqm: form.size_sqm ? Number(form.size_sqm) : undefined,
        notes: form.notes || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal menambahkan kamar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-modal w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h2 className="text-headline-sm font-bold text-on-surface">Tambah Kamar</h2>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>
        <form id="add-room-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nomor Kamar</label>
              <input className="input" placeholder="A101" value={form.room_number} onChange={set('room_number')} required />
            </div>
            <div>
              <label className="label">Lantai <span className="text-on-surface-variant font-normal">opsional</span></label>
              <input type="number" className="input" placeholder="1" value={form.floor} onChange={set('floor')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tipe</label>
              <div className="relative">
                <select className="input appearance-none pr-8" value={form.type} onChange={set('type')}>
                  {['Standard', 'Premium', 'VIP', 'Deluxe'].map((t) => <option key={t}>{t}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="label">Luas (m²) <span className="text-on-surface-variant font-normal">opsional</span></label>
              <input type="number" step="0.1" className="input" placeholder="12.5" value={form.size_sqm} onChange={set('size_sqm')} />
            </div>
          </div>
          <div>
            <label className="label">Harga Sewa/Bulan (Rp)</label>
            <input type="number" className="input" placeholder="1500000" value={form.base_price} onChange={set('base_price')} required />
          </div>
          <div>
            <label className="label">Catatan <span className="text-on-surface-variant font-normal">opsional</span></label>
            <input className="input" placeholder="Kamar menghadap timur, ada AC..." value={form.notes} onChange={set('notes')} />
          </div>
          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-error-container rounded-lg">
              <AlertCircle size={15} className="text-error shrink-0 mt-0.5" />
              <p className="text-body-sm text-error-on-container">{error}</p>
            </div>
          )}
        </form>
        <div className="px-6 py-4 border-t border-outline-variant flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button type="submit" form="add-room-form" disabled={isLoading} className="btn-primary flex-1">
            {isLoading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menyimpan...</span> : <><Plus size={15} />Tambah Kamar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Room Card ────────────────────────────────────────────────────
function RoomCard({ room, propertyId, onRefresh, onDeleteRoom }: {
  room: RoomInProperty;
  propertyId: string;
  onRefresh: () => void;
  onDeleteRoom: (room: RoomInProperty) => void;
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const cfg = ROOM_STATUS_CFG[room.status] ?? ROOM_STATUS_CFG.AVAILABLE;

  const ALLOWED_NEXT: Record<RoomStatus, RoomStatus[]> = {
    AVAILABLE:         ['RESERVED'],
    RESERVED:          ['AVAILABLE', 'OCCUPIED'],
    OCCUPIED:          ['NEEDS_MAINTENANCE'],
    NEEDS_MAINTENANCE: ['AVAILABLE'],
  };

  const nextStatuses = ALLOWED_NEXT[room.status] ?? [];

  const handleStatusChange = async (newStatus: RoomStatus) => {
    setIsUpdating(true);
    setShowStatusMenu(false);
    try {
      await roomsApi.updateStatus(propertyId, room.id, newStatus);
      onRefresh();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="card p-4 hover:shadow-card-hover transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary-fixed flex items-center justify-center shrink-0">
            <BedDouble size={16} className="text-primary-container" />
          </div>
          <div>
            <p className="font-bold text-on-surface">Kamar {room.room_number}</p>
            <p className="text-body-sm text-on-surface-variant">{room.type}{room.floor ? ` · Lt.${room.floor}` : ''}{room.size_sqm ? ` · ${room.size_sqm}m²` : ''}</p>
          </div>
        </div>
        <span className={`badge ${cfg.cn}`}>{cfg.label}</span>
      </div>

      {/* Price */}
      <p className="text-money text-on-surface font-semibold mb-3">{fmt(room.base_price)}<span className="text-on-surface-variant font-normal font-sans text-body-sm">/bln</span></p>

      {/* Tenant info if occupied */}
      {room.active_contract ? (
        <div className="flex items-center gap-2 p-2.5 bg-primary-fixed/40 rounded-lg mb-3">
          <User size={13} className="text-primary-container shrink-0" />
          <div className="min-w-0">
            <p className="text-body-sm font-medium text-primary-container truncate">{room.active_contract.tenant.full_name}</p>
            <p className="font-mono text-label-sm text-primary-container/70">
              s/d {new Date(room.active_contract.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      ) : room.status === 'NEEDS_MAINTENANCE' ? (
        <div className="flex items-center gap-2 p-2.5 bg-error-container/50 rounded-lg mb-3">
          <Wrench size={13} className="text-error shrink-0" />
          <p className="text-body-sm text-error-on-container">Perlu perbaikan</p>
        </div>
      ) : null}

      {/* Status change */}
      {nextStatuses.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            disabled={isUpdating}
            className="btn-ghost btn-sm w-full justify-between text-body-sm"
          >
            <span>{isUpdating ? 'Memproses...' : 'Ubah Status'}</span>
            <ChevronDown size={14} className={`transition-transform ${showStatusMenu ? 'rotate-180' : ''}`} />
          </button>
          {showStatusMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-outline-variant rounded-lg shadow-modal z-10 overflow-hidden">
              {nextStatuses.map((s) => {
                const c = ROOM_STATUS_CFG[s];
                return (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className="w-full px-3 py-2.5 text-left text-body-sm hover:bg-surface-container-low flex items-center gap-2.5 transition-colors"
                  >
                    <CheckCircle2 size={13} className="text-secondary" />
                    <span>→ <span className={`badge py-0 ${c.cn}`}>{c.label}</span></span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Delete room */}
      {!room.active_contract && (
        <button
          onClick={() => onDeleteRoom(room)}
          className="mt-2 w-full flex items-center justify-center gap-1.5 text-body-sm text-error hover:bg-error-container/40 rounded py-1.5 transition-colors"
        >
          <Trash2 size={13} />
          Hapus Kamar
        </button>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export function PropertyDetailPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showDeleteProperty, setShowDeleteProperty] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<RoomInProperty | null>(null);

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => propertiesApi.getById(propertyId!),
    enabled: !!propertyId,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
    queryClient.invalidateQueries({ queryKey: ['properties'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const handleDeleteProperty = async () => {
    try {
      await propertiesApi.delete(propertyId!);
      toastSuccess('Properti berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      navigate('/properties');
    } catch (err: unknown) {
      toastError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          || 'Gagal menghapus properti'
      );
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    try {
      await roomsApi.delete(propertyId!, roomToDelete.id);
      toastSuccess(`Kamar ${roomToDelete.room_number} berhasil dihapus`);
      setRoomToDelete(null);
      refresh();
    } catch (err: unknown) {
      toastError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          || 'Gagal menghapus kamar'
      );
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-5">
          <div className="skeleton h-8 w-48 rounded" />
          <div className="skeleton h-32 rounded-lg" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-20 rounded-lg" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!property) {
    return (
      <DashboardLayout>
        <div className="card p-12 text-center">
          <AlertCircle size={40} className="mx-auto text-error mb-3" />
          <p className="text-body-md text-on-surface-variant">Properti tidak ditemukan</p>
          <button onClick={() => navigate('/properties')} className="btn-secondary mt-4 mx-auto">Kembali</button>
        </div>
      </DashboardLayout>
    );
  }

  const rooms = property.rooms ?? [];

  return (
    <>
      <DashboardLayout
        title={property.name}
        subtitle={`${property.address}, ${property.city}`}
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDeleteProperty(true)}
              className="btn-danger"
            >
              <Trash2 size={15} />
              Hapus
            </button>
            <button onClick={() => setShowEditModal(true)} className="btn-secondary">
              <Pencil size={15} />
              Edit Properti
            </button>
            <button onClick={() => setShowAddRoom(true)} className="btn-primary">
              <Plus size={15} />
              Tambah Kamar
            </button>
          </div>
        }
      >
        {/* Back */}
        <button
          onClick={() => navigate('/properties')}
          className="flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-on-surface mb-5 transition-colors"
        >
          <ArrowLeft size={15} />
          Kembali ke Properti
        </button>

        {/* Info card */}
        <div className="card p-5 mb-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-primary-container" />
            </div>
            <div>
              <h2 className="font-bold text-on-surface text-body-lg">{property.name}</h2>
              <div className="flex items-center gap-1 text-on-surface-variant mt-0.5">
                <MapPin size={13} />
                <p className="text-body-sm">{property.address}, {property.city}, {property.province}</p>
              </div>
            </div>
          </div>
          {(property.description || property.rules) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-outline-variant/50">
              {property.description && (
                <div>
                  <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-1.5">Deskripsi</p>
                  <p className="text-body-sm text-on-surface">{property.description}</p>
                </div>
              )}
              {property.rules && (
                <div>
                  <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-1.5">Peraturan</p>
                  <p className="text-body-sm text-on-surface">{property.rules}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        {property.stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Kamar', value: property.stats.total_rooms, color: 'text-on-surface', icon: BedDouble },
              { label: 'Terisi', value: property.stats.occupied_rooms, color: 'text-primary', icon: BedDouble },
              { label: 'Tingkat Hunian', value: `${property.stats.occupancy_rate}%`, color: property.stats.occupancy_rate >= 80 ? 'text-secondary' : 'text-tertiary-on-container', icon: TrendingUp },
              { label: 'Tagihan Belum Lunas', value: property.stats.unpaid_bills_count, color: property.stats.unpaid_bills_count > 0 ? 'text-error' : 'text-on-surface', icon: Receipt },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="card p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-1">{label}</p>
                  <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-on-surface-variant" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rooms grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest">
              Daftar Kamar ({rooms.length})
            </p>
          </div>
          {rooms.length === 0 ? (
            <div className="card p-12 text-center">
              <BedDouble size={40} className="mx-auto text-outline mb-4" />
              <p className="text-body-md text-on-surface-variant">Belum ada kamar</p>
              <button onClick={() => setShowAddRoom(true)} className="btn-primary mt-4 mx-auto">
                <Plus size={15} />Tambah Kamar Pertama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
              {rooms.map((r) => (
                <RoomCard key={r.id} room={r} propertyId={property.id} onRefresh={refresh} onDeleteRoom={setRoomToDelete} />
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>

      {showEditModal && (
        <EditPropertyModal
          property={property}
          onClose={() => setShowEditModal(false)}
          onSuccess={refresh}
        />
      )}
      {showAddRoom && (
        <AddRoomModal
          propertyId={property.id}
          onClose={() => setShowAddRoom(false)}
          onSuccess={refresh}
        />
      )}

      {showDeleteProperty && (
        <ConfirmDialog
          title="Hapus Properti?"
          description={`Properti "${property.name}" akan dihapus secara permanen. Pastikan tidak ada kamar atau kontrak aktif di properti ini sebelum menghapus.`}
          confirmLabel="Ya, Hapus"
          variant="danger"
          onConfirm={handleDeleteProperty}
          onCancel={() => setShowDeleteProperty(false)}
        />
      )}

      {roomToDelete && (
        <ConfirmDialog
          title={`Hapus Kamar ${roomToDelete.room_number}?`}
          description="Kamar ini akan dihapus. Kamar yang sedang terisi atau memiliki kontrak aktif tidak dapat dihapus."
          confirmLabel="Ya, Hapus Kamar"
          variant="danger"
          onConfirm={handleDeleteRoom}
          onCancel={() => setRoomToDelete(null)}
        />
      )}
    </>
  );
}
