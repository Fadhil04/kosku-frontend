import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { complaintsApi } from '../api/complaints';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const priorityColor: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

const statusLabel: Record<string, string> = {
  OPEN: 'Baru',
  IN_PROGRESS: 'Diproses',
  RESOLVED: 'Selesai',
  CLOSED: 'Ditutup',
};

const nextStatus: Record<string, string> = {
  OPEN: 'IN_PROGRESS',
  IN_PROGRESS: 'RESOLVED',
  RESOLVED: 'CLOSED',
};

const nextStatusLabel: Record<string, string> = {
  OPEN: 'Proses',
  IN_PROGRESS: 'Selesaikan',
  RESOLVED: 'Tutup',
};

function UpdateStatusDialog({
  complaint,
  onClose,
  onSuccess,
}: {
  complaint: { id: string; status: string; title: string };
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const next = nextStatus[complaint.status];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await complaintsApi.updateStatus(complaint.id, next, note || undefined);
      onSuccess();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Status Komplain</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">{complaint.title}</p>
        <p className="text-sm">
          Status akan berubah dari{' '}
          <span className="font-medium">{statusLabel[complaint.status]}</span> ke{' '}
          <span className="font-medium">{statusLabel[next]}</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Catatan (opsional)</Label>
            <Input
              placeholder="Teknisi dijadwalkan besok pukul 10.00..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : 'Update Status'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ComplaintsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<{
    id: string;
    status: string;
    title: string;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['complaints', statusFilter],
    queryFn: () => complaintsApi.getAll({ status: statusFilter || undefined }),
  });

  const complaints = data?.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Komplain</h2>
            <p className="text-slate-500 mt-1">Pantau dan tangani komplain penghuni</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Status</SelectItem>
              <SelectItem value="OPEN">Baru</SelectItem>
              <SelectItem value="IN_PROGRESS">Diproses</SelectItem>
              <SelectItem value="RESOLVED">Selesai</SelectItem>
              <SelectItem value="CLOSED">Ditutup</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="h-16 bg-slate-100 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-slate-500">Tidak ada komplain ditemukan</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {complaints.map((complaint) => (
              <Card key={complaint.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-slate-900">{complaint.title}</p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[complaint.priority]}`}
                        >
                          {complaint.priority}
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {statusLabel[complaint.status]}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {complaint.tenant.full_name} · Kamar {complaint.room.room_number} ·{' '}
                        {new Date(complaint.created_at).toLocaleDateString('id-ID')}
                      </p>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-1">
                        {complaint._count.responses} balasan
                      </p>
                    </div>
                    {nextStatus[complaint.status] && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelected(complaint)}
                      >
                        {nextStatusLabel[complaint.status]}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <UpdateStatusDialog
          complaint={selected}
          onClose={() => setSelected(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['complaints'] })}
        />
      )}
    </DashboardLayout>
  );
}