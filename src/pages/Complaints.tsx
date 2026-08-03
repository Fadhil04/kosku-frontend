import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { complaintsApi } from '../api/complaints';
import { DashboardLayout } from '../components/DashboardLayout';
import { MessageSquare, X, AlertCircle, ArrowRight, Clock, MessageCircle } from 'lucide-react';
import type { Complaint } from '../types';

// ── Config maps ──────────────────────────────────────────────────
const PRIORITY_CONFIG: Record<string, { label: string; cn: string }> = {
  LOW:    { label: 'Rendah',  cn: 'bg-surface-container text-on-surface-variant' },
  MEDIUM: { label: 'Sedang',  cn: 'bg-primary-fixed text-primary-container' },
  HIGH:   { label: 'Tinggi',  cn: 'bg-tertiary-fixed text-tertiary-container' },
  URGENT: { label: 'Urgen',   cn: 'bg-error-container text-error' },
};

const STATUS_CONFIG: Record<string, { label: string; cn: string }> = {
  OPEN:        { label: 'Baru',      cn: 'badge-open' },
  IN_PROGRESS: { label: 'Diproses',  cn: 'badge-in-progress' },
  RESOLVED:    { label: 'Selesai',   cn: 'badge-resolved' },
  CLOSED:      { label: 'Ditutup',   cn: 'badge-closed' },
};

const NEXT_STATUS: Record<string, string> = {
  OPEN: 'IN_PROGRESS',
  IN_PROGRESS: 'RESOLVED',
  RESOLVED: 'CLOSED',
};

const NEXT_ACTION_LABEL: Record<string, string> = {
  OPEN: 'Mulai Proses',
  IN_PROGRESS: 'Tandai Selesai',
  RESOLVED: 'Tutup Komplain',
};

// ── Category label map ───────────────────────────────────────────
const CATEGORY_LABEL: Record<string, string> = {
  FACILITY_DAMAGE:        'Kerusakan Fasilitas',
  NEIGHBOR_DISTURBANCE:   'Gangguan Tetangga',
  CLEANLINESS:            'Kebersihan',
  SECURITY:               'Keamanan',
  OTHER:                  'Lainnya',
};

// ── Update Status Modal ──────────────────────────────────────────
function UpdateStatusModal({
  complaint,
  onClose,
  onSuccess,
}: {
  complaint: Complaint;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const next = NEXT_STATUS[complaint.status];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await complaintsApi.updateStatus(complaint.id, next, note || undefined);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Gagal update status',
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
            <h2 className="text-headline-sm font-bold text-on-surface">Update Status Komplain</h2>
            <p className="text-body-sm text-on-surface-variant mt-0.5 line-clamp-1">{complaint.title}</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>

        {/* Status transition visual */}
        <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <span className={STATUS_CONFIG[complaint.status].cn}>
              {STATUS_CONFIG[complaint.status].label}
            </span>
            <ArrowRight size={16} className="text-outline shrink-0" />
            <span className={STATUS_CONFIG[next].cn}>
              {STATUS_CONFIG[next].label}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="label">
              Catatan <span className="text-on-surface-variant font-normal">(opsional)</span>
            </label>
            <input
              className="input"
              placeholder="Teknisi dijadwalkan besok pukul 10.00..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
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
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                NEXT_ACTION_LABEL[complaint.status]
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Complaint Card ───────────────────────────────────────────────
function ComplaintCard({
  complaint,
  onAction,
  onDetail,
}: {
  complaint: Complaint;
  onAction: (c: Complaint) => void;
  onDetail: (id: string) => void;
}) {
  const priority = PRIORITY_CONFIG[complaint.priority] ?? PRIORITY_CONFIG.MEDIUM;
  const status = STATUS_CONFIG[complaint.status] ?? STATUS_CONFIG.OPEN;
  const canAct = !!NEXT_STATUS[complaint.status];

  const daysOpen = Math.floor(
    (Date.now() - new Date(complaint.created_at).getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <div className="card p-5 flex items-start justify-between gap-4 group hover:shadow-card-hover transition-all">
      <div className="flex-1 min-w-0">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className={status.cn}>{status.label}</span>
          <span className={`badge ${priority.cn}`}>{priority.label}</span>
          {complaint.category && (
            <span className="badge bg-surface-container text-on-surface-variant">
              {CATEGORY_LABEL[complaint.category] ?? complaint.category}
            </span>
          )}
        </div>

        {/* Title */}
        <p className="text-body-md font-semibold text-on-surface">{complaint.title}</p>

        {/* Meta */}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="text-body-sm text-on-surface-variant">
            {complaint.tenant.full_name} · Kamar {complaint.room.room_number}
          </span>
          <span className="text-body-sm text-on-surface-variant flex items-center gap-1">
            <Clock size={12} />
            {daysOpen === 0 ? 'Hari ini' : `${daysOpen} hari lalu`}
          </span>
          {complaint._count.responses > 0 && (
            <span className="text-body-sm text-on-surface-variant flex items-center gap-1">
              <MessageCircle size={12} />
              {complaint._count.responses} balasan
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="shrink-0 flex flex-col gap-2 items-end">
        <button
          onClick={() => onDetail(complaint.id)}
          className="btn-ghost btn-sm"
        >
          Detail
        </button>
        {canAct ? (
          <button
            onClick={() => onAction(complaint)}
            className="btn-secondary btn-sm whitespace-nowrap"
          >
            {NEXT_ACTION_LABEL[complaint.status]}
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export function ComplaintsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Complaint | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['complaints', statusFilter],
    queryFn: () => complaintsApi.getAll({ status: statusFilter || undefined }),
  });

  const complaints = data?.data ?? [];

  // Count per status for tab chips
  const allData = useQuery({
    queryKey: ['complaints', ''],
    queryFn: () => complaintsApi.getAll({}),
    enabled: statusFilter !== '',
  });
  const allComplaints = allData.data?.data ?? complaints;
  const counts = allComplaints.reduce(
    (acc, c) => { acc[c.status] = (acc[c.status] ?? 0) + 1; return acc; },
    {} as Record<string, number>,
  );

  return (
    <>
      <DashboardLayout
        title="Komplain"
        subtitle="Pantau dan tangani pengaduan penghuni"
        action={
          <select
            className="input py-2 w-44"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="OPEN">Baru</option>
            <option value="IN_PROGRESS">Diproses</option>
            <option value="RESOLVED">Selesai</option>
            <option value="CLOSED">Ditutup</option>
          </select>
        }
      >
        {/* Status filter chips */}
        <div className="flex items-center gap-2.5 mb-5 flex-wrap">
          {[
            { key: 'OPEN',        label: 'Baru',     cn: 'bg-error-container text-error-on-container' },
            { key: 'IN_PROGRESS', label: 'Diproses', cn: 'bg-tertiary-fixed text-tertiary-container' },
            { key: 'RESOLVED',    label: 'Selesai',  cn: 'bg-secondary-container text-secondary-on-container' },
            { key: 'CLOSED',      label: 'Ditutup',  cn: 'bg-surface-container text-on-surface-variant' },
          ].map(({ key, label, cn }) => {
            const count = counts[key] ?? 0;
            if (!count) return null;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-body-sm font-medium transition-all ${cn} ${statusFilter === key ? 'ring-2 ring-offset-1 ring-current' : 'opacity-75 hover:opacity-100'}`}
              >
                <span className="font-mono font-bold tabular-nums">{count}</span>
                {label}
              </button>
            );
          })}
          {statusFilter && (
            <button
              onClick={() => setStatusFilter('')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-body-sm text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <X size={13} />
              Reset
            </button>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5">
                <div className="flex gap-2 mb-3">
                  <div className="skeleton h-5 w-16 rounded-full" />
                  <div className="skeleton h-5 w-14 rounded-full" />
                </div>
                <div className="skeleton h-4 w-64 rounded mb-2" />
                <div className="skeleton h-3 w-40 rounded" />
              </div>
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <div className="card p-16 text-center">
            <MessageSquare size={40} className="mx-auto text-outline mb-4" />
            <p className="text-body-md text-on-surface-variant">Tidak ada komplain ditemukan</p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {complaints.map((c) => (
              <ComplaintCard key={c.id} complaint={c} onAction={setSelected} onDetail={(id) => navigate(`/complaints/${id}`)} />
            ))}
          </div>
        )}
      </DashboardLayout>

      {selected && (
        <UpdateStatusModal
          complaint={selected}
          onClose={() => setSelected(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['complaints'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setSelected(null);
          }}
        />
      )}
    </>
  );
}
