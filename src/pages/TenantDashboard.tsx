import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAuth } from "../hooks/useAuth";
import { billsApi } from "../api/bills";
import { complaintsApi } from "../api/complaints";
import { Home, ArrowRight } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export function TenantDashboardPage() {
  const { user } = useAuth();

  const { data: billsData, isLoading: billsLoading } = useQuery({
    queryKey: ["tenant-dashboard-bills"],
    queryFn: () => billsApi.getAll({ limit: 5 }),
  });

  const { data: complaintsData, isLoading: complaintsLoading } = useQuery({
    queryKey: ["tenant-dashboard-complaints"],
    queryFn: () => complaintsApi.getAll({ limit: 5 }),
  });

  const bills = billsData?.data ?? [];
  const complaints = complaintsData?.data ?? [];

  const unpaidBills = bills.filter(
    (bill) => bill.status === "UNPAID" || bill.status === "PARTIALLY_PAID",
  );
  const totalUnpaid = unpaidBills.reduce(
    (sum, bill) => sum + bill.final_amount,
    0,
  );
  const openComplaints = complaints.filter(
    (item) => item.status === "OPEN" || item.status === "IN_PROGRESS",
  ).length;

  return (
    <DashboardLayout
      title="Dashboard Penghuni"
      subtitle="Pantau tagihan, komplain, dan status kamar kamu"
    >
      <div className="space-y-6 animate-fade-in">
        <div className="card p-6 bg-gradient-to-br from-primary/10 via-surface to-primary-fixed/20">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest">
                Selamat datang
              </p>
              <h2 className="text-headline-md font-bold text-on-surface mt-1">
                Halo, {user?.full_name ?? "Penghuni"}
              </h2>
              <p className="text-body-md text-on-surface-variant mt-2">
                Semua informasi penting tentang hunian kamu ada di sini.
              </p>
            </div>
            <Link
              to="/tenant/profile"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Home size={16} /> Lihat profil
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-5">
            <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest">
              Tagihan belum lunas
            </p>
            <p className="text-2xl font-bold text-on-surface mt-3">
              {unpaidBills.length}
            </p>
            <p className="text-body-sm text-on-surface-variant mt-1">
              Total {fmt(totalUnpaid)}
            </p>
          </div>
          <div className="card p-5">
            <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest">
              Komplain aktif
            </p>
            <p className="text-2xl font-bold text-on-surface mt-3">
              {openComplaints}
            </p>
            <p className="text-body-sm text-on-surface-variant mt-1">
              Yang sedang ditindaklanjuti
            </p>
          </div>
          <div className="card p-5">
            <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest">
              Informasi terbaru
            </p>
            <p className="text-2xl font-bold text-on-surface mt-3">
              {bills.length + complaints.length}
            </p>
            <p className="text-body-sm text-on-surface-variant mt-1">
              Tagihan dan komplain terpantau
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest">
                  Tagihan terbaru
                </p>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  Pantau pembayaran kamu
                </p>
              </div>
              <Link
                to="/tenant/bills"
                className="text-primary font-medium inline-flex items-center gap-1"
              >
                Lihat semua <ArrowRight size={15} />
              </Link>
            </div>

            {billsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((item) => (
                  <div key={item} className="skeleton h-12 rounded-lg" />
                ))}
              </div>
            ) : bills.length === 0 ? (
              <div className="rounded-lg border border-dashed border-outline-variant p-4 text-center text-body-sm text-on-surface-variant">
                Belum ada tagihan yang tersedia.
              </div>
            ) : (
              <div className="space-y-3">
                {bills.slice(0, 3).map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between rounded-lg border border-outline-variant/70 p-3"
                  >
                    <div>
                      <p className="font-semibold text-on-surface">
                        {bill.property.name} · Kamar {bill.room.room_number}
                      </p>
                      <p className="text-body-sm text-on-surface-variant mt-0.5">
                        {new Date(bill.due_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-on-surface">
                        {fmt(bill.final_amount)}
                      </p>
                      <p className="text-body-sm text-on-surface-variant mt-0.5">
                        {bill.status === "PAID" ? "Lunas" : "Belum lunas"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest">
                  Komplain terbaru
                </p>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  Riwayat aduan kamu
                </p>
              </div>
              <Link
                to="/tenant/complaints"
                className="text-primary font-medium inline-flex items-center gap-1"
              >
                Tambah komplain <ArrowRight size={15} />
              </Link>
            </div>

            {complaintsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((item) => (
                  <div key={item} className="skeleton h-12 rounded-lg" />
                ))}
              </div>
            ) : complaints.length === 0 ? (
              <div className="rounded-lg border border-dashed border-outline-variant p-4 text-center text-body-sm text-on-surface-variant">
                Belum ada komplain yang dibuat.
              </div>
            ) : (
              <div className="space-y-3">
                {complaints.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-outline-variant/70 p-3"
                  >
                    <div>
                      <p className="font-semibold text-on-surface">
                        {item.title}
                      </p>
                      <p className="text-body-sm text-on-surface-variant mt-0.5">
                        {item.room.room_number}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-body-sm font-medium text-primary">
                        {item.status}
                      </p>
                      <p className="text-body-sm text-on-surface-variant mt-0.5">
                        {item.priority}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
