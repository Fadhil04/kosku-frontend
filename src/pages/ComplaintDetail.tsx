import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { complaintsApi } from '../api/complaints';
import { DashboardLayout } from '../components/DashboardLayout';
import { useToast } from '../components/Toast';
import {
  ArrowLeft, MessageCircle, User, Building2, Clock, AlertCircle, Send,
} from 'lucide-react';

const PRIORITY_CFG: Record<string, { label: string; cn: string }> = {
  LOW:    { label: 'Rendah',  cn: 'bg-surface-container text-on-surface-variant' },
  MEDIUM: { label: 'Sedang',  cn: 'bg-primary-fixed text-primary-container' },
  HIGH:   { label: 'Tinggi',  cn: 'bg-tertiary-fixed text-tertiary-container' },
  URGENT: { label: 'Urgen',   cn: 'bg-error-container text-error-on-container' },
};
const STATUS_CFG: Record<string, { label: string; cn: string }> = {
  OPEN:        { label: 'Baru',     cn: 'badge-open' },
  IN_PROGRESS: { label: 'Diproses', cn: 'badge-in-progress' },
  RESOLVED:    { label: 'Selesai',  cn: 'badge-resolved' },
  CLOSED:      { label: 'Ditutup',  cn: 'badge-closed' },
};
const NEXT_STATUS: Record<string, string> = {
  OPEN: 'IN_PROGRESS', IN_PROGRESS: 'RESOLVED', RESOLVED: 'CLOSED',
};
const NEXT_LABEL: Record<string, string> = {
  OPEN: 'Mulai Proses', IN_PROGRESS: 'Tandai Selesai', RESOLVED: 'Tutup',
};
const CATEGORY_LABEL: Record<string, string> = {
  FACILITY_DAMAGE: 'Kerusakan Fasilitas',
  NEIGHBOR_DISTURBANCE: 'Gangguan Tetangga',
  CLEANLINESS: 'Kebersihan',
  SECURITY: 'Keamanan',
  OTHER: 'Lainnya',
};

interface ComplaintResponse { id: string; responderId: string; responderRole: string; message: string; createdAt: string; }

export function ComplaintDetailPage() {
  const { complaintId } = useParams<{ complaintId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const { data: complaint, isLoading } = useQuery({
    queryKey: ['complaint', complaintId],
    queryFn: () => complaintsApi.getById(complaintId!),
    enabled: !!complaintId,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['complaint', complaintId] });
    queryClient.invalidateQueries({ queryKey: ['complaints'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await complaintsApi.addResponse(complaintId!, message.trim());
      setMessage('');
      success('Balasan dikirim');
      refresh();
    } catch (err: unknown) {
      toastError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal kirim balasan');
    } finally { setSending(false); }
  };

  const handleUpdateStatus = async () => {
    if (!complaint) return;
    const next = NEXT_STATUS[complaint.status];
    if (!next) return;
    setUpdatingStatus(true);
    try {
      await complaintsApi.updateStatus(complaintId!, next);
      success(`Status diperbarui ke ${STATUS_CFG[next]?.label}`);
      refresh();
    } catch (err: unknown) {
      toastError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal update status');
    } finally { setUpdatingStatus(false); }
  };

  if (isLoading) return (
    <DashboardLayout>
      <div className="space-y-4 max-w-2xl">
        {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-lg" />)}
      </div>
    </DashboardLayout>
  );

  if (!complaint) return (
    <DashboardLayout>
      <div className="card p-12 text-center max-w-md mx-auto">
        <AlertCircle size={40} className="mx-auto text-error mb-3" />
        <p className="text-body-md text-on-surface-variant">Komplain tidak ditemukan</p>
        <button onClick={() => navigate('/complaints')} className="btn-secondary mt-4 mx-auto">Kembali</button>
      </div>
    </DashboardLayout>
  );

  const statusCfg = STATUS_CFG[complaint.status] ?? STATUS_CFG.OPEN;
  const priorityCfg = PRIORITY_CFG[complaint.priority] ?? PRIORITY_CFG.MEDIUM;
  const nextStatus = NEXT_STATUS[complaint.status];
  const responses: ComplaintResponse[] = (complaint as unknown as { responses?: ComplaintResponse[] }).responses ?? [];
  const daysOpen = Math.floor((Date.now() - new Date(complaint.createdAt as unknown as string).getTime()) / 86400000);

  return (
    <DashboardLayout
      title={complaint.title}
      subtitle="Detail dan thread percakapan"
      action={
        nextStatus && (
          <button onClick={handleUpdateStatus} disabled={updatingStatus} className="btn-primary">
            {updatingStatus
              ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Memproses...</span>
              : NEXT_LABEL[complaint.status]
            }
          </button>
        )
      }
    >
      <button onClick={() => navigate('/complaints')}
        className="flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-on-surface mb-5 transition-colors">
        <ArrowLeft size={15} />Kembali ke Komplain
      </button>

      <div className="max-w-2xl space-y-5 animate-fade-in">
        {/* Info card */}
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={statusCfg.cn}>{statusCfg.label}</span>
              <span className={`badge ${priorityCfg.cn}`}>{priorityCfg.label}</span>
              <span className="badge bg-surface-container text-on-surface-variant">
                {CATEGORY_LABEL[complaint.category as string] ?? complaint.category}
              </span>
            </div>
            <div className="flex items-center gap-1 text-body-sm text-on-surface-variant shrink-0">
              <Clock size={12} />
              <span>{daysOpen === 0 ? 'Hari ini' : `${daysOpen} hari lalu`}</span>
            </div>
          </div>

          <p className="text-body-lg font-semibold text-on-surface mb-3">{complaint.title}</p>
          <p className="text-body-md text-on-surface leading-relaxed">{(complaint as unknown as { description?: string }).description}</p>

          <div className="mt-4 pt-4 border-t border-outline-variant/50 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <User size={14} className="text-on-surface-variant" />
              <div>
                <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest">Penghuni</p>
                <p className="text-body-sm font-medium text-on-surface">{complaint.tenant.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-on-surface-variant" />
              <div>
                <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest">Kamar</p>
                <p className="text-body-sm font-medium text-on-surface">Kamar {complaint.room.room_number}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Thread */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-outline-variant flex items-center gap-2">
            <MessageCircle size={15} className="text-on-surface-variant" />
            <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest">
              Percakapan ({responses.length})
            </p>
          </div>

          {responses.length === 0 ? (
            <div className="px-5 py-8 text-center text-on-surface-variant text-body-sm">
              Belum ada balasan. Tambahkan respon pertama.
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/50">
              {responses.map((r) => (
                <div key={r.id} className={`px-5 py-4 ${r.responderRole === 'owner' ? 'bg-primary-fixed/20' : ''}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`badge text-[10px] ${r.responderRole === 'owner' ? 'bg-primary-fixed text-primary-container' : 'bg-surface-container text-on-surface-variant'}`}>
                      {r.responderRole === 'owner' ? 'Owner' : 'Penghuni'}
                    </span>
                    <span className="text-body-sm text-on-surface-variant">
                      {new Date(r.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-body-md text-on-surface">{r.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Reply form — hanya jika belum CLOSED */}
          {complaint.status !== 'CLOSED' && (
            <div className="px-5 py-4 border-t border-outline-variant bg-surface-container-low">
              <form onSubmit={handleSendResponse} className="flex gap-3">
                <input
                  className="input flex-1 py-2"
                  placeholder="Tulis balasan..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={sending}
                />
                <button type="submit" disabled={sending || !message.trim()} className="btn-primary btn-sm px-4">
                  {sending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={14} />Kirim</>}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
