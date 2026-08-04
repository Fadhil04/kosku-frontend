import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "../components/DashboardLayout";
import { complaintsApi } from "../api/complaints";
import { billsApi } from "../api/bills";
import { useToast } from "../components/Toast";
import { MessageSquare, AlertCircle, Send, Clock } from "lucide-react";
import type { Complaint } from "../types";

const CATEGORY_LABEL: Record<string, string> = {
  FACILITY_DAMAGE: "Kerusakan Fasilitas",
  NEIGHBOR_DISTURBANCE: "Gangguan Tetangga",
  CLEANLINESS: "Kebersihan",
  SECURITY: "Keamanan",
  OTHER: "Lainnya",
};

function ComplaintCard({ complaint }: { complaint: Complaint }) {
  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-on-surface">{complaint.title}</p>
          <p className="text-body-sm text-on-surface-variant mt-1">
            {complaint.description}
          </p>
        </div>
        <span className="rounded-full bg-primary-fixed px-3 py-1 text-label-sm text-primary-container">
          {complaint.status}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 text-body-sm text-on-surface-variant">
        <span className="rounded-full bg-surface-container px-2.5 py-1">
          {CATEGORY_LABEL[complaint.category] ?? complaint.category}
        </span>
        <span className="rounded-full bg-surface-container px-2.5 py-1">
          Prioritas {complaint.priority}
        </span>
        <span className="rounded-full bg-surface-container px-2.5 py-1">
          Kamar {complaint.room.room_number}
        </span>
      </div>

      <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
        <Clock size={14} />
        <span>
          {formatDate(
            complaint.created_at ??
              (complaint as { createdAt?: string }).createdAt,
          )}
        </span>
      </div>
    </div>
  );
}

export function TenantComplaintsPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("FACILITY_DAMAGE");
  const [priority, setPriority] = useState("MEDIUM");
  const [roomId, setRoomId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { data: billsData } = useQuery({
    queryKey: ["tenant-complaint-rooms"],
    queryFn: () => billsApi.getAll({ limit: 100 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["tenant-complaints"],
    queryFn: () => complaintsApi.getAll({ limit: 100 }),
  });

  const roomOptions = useMemo(() => {
    const rooms = (billsData?.data ?? []).map((bill) => ({
      id: bill.room_id,
      label: `${bill.property.name} · Kamar ${bill.room.room_number}`,
    }));
    return rooms.filter(
      (item, index, arr) =>
        arr.findIndex((entry) => entry.id === item.id) === index,
    );
  }, [billsData]);

  useEffect(() => {
    if (!roomId && roomOptions[0]) {
      setRoomId(roomOptions[0].id);
    }
  }, [roomId, roomOptions]);

  const complaints = data?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await complaintsApi.createComplaint({
        room_id: roomId,
        title,
        description,
        category: category as
          | "FACILITY_DAMAGE"
          | "NEIGHBOR_DISTURBANCE"
          | "CLEANLINESS"
          | "SECURITY"
          | "OTHER",
        priority: priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      });
      success("Komplain berhasil dikirim");
      setTitle("");
      setDescription("");
      setCategory("FACILITY_DAMAGE");
      setPriority("MEDIUM");
      await queryClient.invalidateQueries({ queryKey: ["tenant-complaints"] });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Gagal mengirim komplain";
      setError(msg);
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      title="Komplain Saya"
      subtitle="Sampaikan masalah hunian ke pemilik"
    >
      <div className="space-y-6 animate-fade-in">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center">
              <MessageSquare size={18} className="text-primary-container" />
            </div>
            <div>
              <p className="font-semibold text-on-surface">
                Ajukan komplain baru
              </p>
              <p className="text-body-sm text-on-surface-variant">
                Kirim pengaduan untuk masalah di kamar Anda.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Kamar</label>
              <select
                className="input"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                required
              >
                {roomOptions.length === 0 ? (
                  <option value="">Belum ada kamar</option>
                ) : (
                  roomOptions.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.label}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="label">Judul</label>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: AC tidak dingin"
                required
              />
            </div>

            <div>
              <label className="label">Deskripsi</label>
              <textarea
                className="input min-h-[110px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan masalah yang Anda alami"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Kategori</label>
                <select
                  className="input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="FACILITY_DAMAGE">Kerusakan Fasilitas</option>
                  <option value="NEIGHBOR_DISTURBANCE">
                    Gangguan Tetangga
                  </option>
                  <option value="CLEANLINESS">Kebersihan</option>
                  <option value="SECURITY">Keamanan</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="label">Prioritas</label>
                <select
                  className="input"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="LOW">Rendah</option>
                  <option value="MEDIUM">Sedang</option>
                  <option value="HIGH">Tinggi</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-lg bg-error-container p-3 text-error-on-container">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span className="text-body-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary inline-flex items-center gap-2"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                  Mengirim...
                </span>
              ) : (
                <>
                  <Send size={15} /> Kirim komplain
                </>
              )}
            </button>
          </form>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-on-surface">Riwayat komplain</p>
              <p className="text-body-sm text-on-surface-variant">
                Status pengaduan Anda
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((item) => (
                <div key={item} className="skeleton h-20 rounded-lg" />
              ))}
            </div>
          ) : complaints.length === 0 ? (
            <div className="rounded-lg border border-dashed border-outline-variant p-4 text-center text-body-sm text-on-surface-variant">
              Belum ada komplain yang pernah dibuat.
            </div>
          ) : (
            <div className="grid gap-4">
              {complaints.map((complaint) => (
                <ComplaintCard key={complaint.id} complaint={complaint} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
