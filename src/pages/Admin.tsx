import { useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { useToast } from "../components/Toast";
import { adminApi } from "../api/admin";
import {
  BellRing,
  CalendarDays,
  FileClock,
  UserCheck,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

interface TriggerCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  buttonText: string;
  onTrigger: () => Promise<void>;
  color: "blue" | "green" | "amber" | "red";
}

function TriggerCard({
  title,
  description,
  icon: Icon,
  buttonText,
  onTrigger,
  color,
}: TriggerCardProps) {
  const [loading, setLoading] = useState(false);

  const iconBg = {
    blue: "bg-primary-fixed text-primary-container",
    green: "bg-secondary-container text-secondary",
    amber: "bg-tertiary-fixed text-tertiary-container",
    red: "bg-error-container text-error",
  }[color];

  const handleTrigger = async () => {
    setLoading(true);
    try {
      await onTrigger();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 flex flex-col justify-between h-full hover:shadow-card-hover transition-all">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon size={20} />
          </div>
          <h3 className="text-body-lg font-bold text-on-surface">{title}</h3>
        </div>
        <p className="text-body-sm text-on-surface-variant leading-relaxed mb-6">
          {description}
        </p>
      </div>
      <button
        onClick={handleTrigger}
        disabled={loading}
        className="btn-primary w-full py-2"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Memproses...
          </span>
        ) : (
          buttonText
        )}
      </button>
    </div>
  );
}

export function AdminPage() {
  const { success, error: toastError } = useToast();

  const handleBillReminders = async () => {
    try {
      const res = await adminApi.triggerBillReminders();
      success(res.message || "Job pengingat tagihan berhasil dipicu!");
    } catch (err: unknown) {
      toastError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Gagal memicu job pengingat tagihan",
      );
    }
  };

  const handleMonthlyBills = async () => {
    try {
      const res = await adminApi.triggerMonthlyBills();
      success(res.message || "Job tagihan bulanan berhasil dipicu!");
    } catch (err: unknown) {
      toastError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Gagal memicu job tagihan bulanan",
      );
    }
  };

  const handleExpiringContracts = async () => {
    try {
      const res = await adminApi.triggerExpiringContracts();
      success(res.message || "Job cek kontrak berakhir berhasil dipicu!");
    } catch (err: unknown) {
      toastError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Gagal memicu job kontrak berakhir",
      );
    }
  };

  const handleBackfill = async () => {
    try {
      const res = await adminApi.triggerBackfill();
      success(
        res.message || `Berhasil melakukan update data tenant!`
      );
    } catch (err: unknown) {
      toastError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Gagal melakukan backfill relasi tenant-owner",
      );
    }
  };

  return (
    <DashboardLayout
      title="Utilitas Admin"
      subtitle="Jalankan pemicu manual untuk job sistem dan backfill data"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 bg-primary-fixed/20 border border-primary/20 rounded-lg max-w-4xl">
          <ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-body-sm font-semibold text-primary">
              Area Khusus Pemilik (System Administrator)
            </p>
            <p className="text-body-sm text-on-surface-variant mt-0.5 leading-relaxed">
              Semua aksi di bawah ini akan menambahkan job ke sistem antrean backend (Queue System) secara real-time. Gunakan dengan bijak hanya saat diperlukan untuk memicu sinkronisasi manual.
            </p>
          </div>
        </div>

        {/* Triggers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl">
          <TriggerCard
            title="Generate Tagihan Bulanan"
            description="Memicu generate tagihan bulanan otomatis untuk semua kontrak aktif yang jadwal penagihannya jatuh pada hari ini."
            icon={CalendarDays}
            buttonText="Trigger Generate Tagihan"
            onTrigger={handleMonthlyBills}
            color="blue"
          />

          <TriggerCard
            title="Pengingat Tagihan (Email)"
            description="Memeriksa tagihan yang mendekati jatuh tempo atau terlambat, lalu mengirimkan email pengingat (reminders) ke penghuni."
            icon={BellRing}
            buttonText="Trigger Kirim Pengingat"
            onTrigger={handleBillReminders}
            color="amber"
          />

          <TriggerCard
            title="Cek Kontrak Berakhir"
            description="Memeriksa semua kontrak yang akan segera berakhir (dalam 30 hari) untuk mengubah status status kontrak dan mengirimkan notifikasi peringatan."
            icon={FileClock}
            buttonText="Trigger Cek Kontrak"
            onTrigger={handleExpiringContracts}
            color="red"
          />

          <TriggerCard
            title="Backfill Owner-Tenant"
            description="Mengecek dan menghubungkan tenant-tenant lama yang kehilangan relasi pemilik ke ID owner yang terdaftar saat ini berdasarkan riwayat kontrak mereka."
            icon={UserCheck}
            buttonText="Trigger Backfill Data"
            onTrigger={handleBackfill}
            color="green"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
