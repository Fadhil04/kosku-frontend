import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "../components/DashboardLayout";
import { billsApi } from "../api/bills";
import { PayButton } from "../components/PayButton";
import { Receipt, Clock, CheckCircle2 } from "lucide-react";
import type { Bill } from "../types";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

function BillCard({ bill }: { bill: Bill }) {
  const isPaid = bill.status === "PAID";
  const isPayable = bill.status === "UNPAID" || bill.status === "PARTIALLY_PAID";

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-on-surface">{bill.property.name}</p>
          <p className="text-body-sm text-on-surface-variant">
            Kamar {bill.room.room_number}
          </p>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-label-sm ${isPaid ? "bg-secondary-container text-secondary" : "bg-tertiary-fixed text-tertiary-container"}`}
        >
          {isPaid ? "Lunas" : "Belum Lunas"}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest">
            Periode
          </p>
          <p className="text-body-md font-semibold text-on-surface mt-1">
            {bill.period_month}/{bill.period_year}
          </p>
        </div>
        <div>
          <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest">
            Jatuh Tempo
          </p>
          <p className="text-body-md font-semibold text-on-surface mt-1">
            {new Date(bill.due_date).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
        <div>
          <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest">
            Jumlah
          </p>
          <p className="text-body-md font-semibold text-on-surface mt-1">
            {fmt(bill.final_amount)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
        {isPaid ? (
          <CheckCircle2 size={15} className="text-secondary" />
        ) : (
          <Clock size={15} className="text-tertiary" />
        )}
        <span>
          {isPaid ? "Pembayaran sudah diterima" : "Pembayaran masih menunggu"}
        </span>
      </div>

      {isPayable && (
        <div className="flex justify-end border-t border-outline-variant pt-3">
          <PayButton billId={bill.id} />
        </div>
      )}
    </div>
  );
}

export function TenantBillsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["tenant-bills"],
    queryFn: () => billsApi.getAll({ limit: 100 }),
  });

  const bills = data?.data ?? [];

  return (
    <DashboardLayout
      title="Tagihan Saya"
      subtitle="Lihat semua tagihan hunian Anda"
    >
      <div className="space-y-4 animate-fade-in">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center">
            <Receipt size={18} className="text-primary-container" />
          </div>
          <div>
            <p className="font-semibold text-on-surface">Riwayat pembayaran</p>
            <p className="text-body-sm text-on-surface-variant">
              Pastikan tagihan selalu terbayar tepat waktu.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="card p-5 skeleton h-24 rounded-xl" />
            ))}
          </div>
        ) : bills.length === 0 ? (
          <div className="card p-8 text-center text-body-md text-on-surface-variant">
            Belum ada tagihan untuk akun Anda.
          </div>
        ) : (
          <div className="grid gap-4">
            {bills.map((bill) => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
