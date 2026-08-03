import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { billsApi } from "../api/bills";
import { DashboardLayout } from "../components/DashboardLayout";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ags",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PAID: "bg-green-100 text-green-700",
    UNPAID: "bg-red-100 text-red-700",
    PARTIALLY_PAID: "bg-orange-100 text-orange-700",
    WAIVED: "bg-slate-100 text-slate-700",
  };
  const label: Record<string, string> = {
    PAID: "Lunas",
    UNPAID: "Belum Lunas",
    PARTIALLY_PAID: "Sebagian",
    WAIVED: "Dihapuskan",
  };
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full font-medium ${map[status] || ""}`}
    >
      {label[status] || status}
    </span>
  );
}

function PaymentDialog({
  bill,
  onClose,
  onSuccess,
}: {
  bill: { id: string; final_amount: number; tenant: { full_name: string } };
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState(bill.final_amount.toString());
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [refNumber, setRefNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await billsApi.recordPayment(bill.id, {
        idempotency_key: `pay-${bill.id}-${Date.now()}`,
        amount: Number(amount),
        payment_method: method,
        payment_date: new Date().toISOString().split("T")[0],
        reference_number: refNumber || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Gagal mencatat pembayaran",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatRupiah = (n: number) => new Intl.NumberFormat("id-ID").format(n);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Catat Pembayaran</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-500">
          Penghuni:{" "}
          <span className="font-medium text-slate-700">
            {bill.tenant.full_name}
          </span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Jumlah Pembayaran (Rp)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={formatRupiah(bill.final_amount)}
              required
            />
            <p className="text-xs text-slate-500">
              Total tagihan: Rp {formatRupiah(bill.final_amount)}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Metode Pembayaran</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Tunai</SelectItem>
                <SelectItem value="BANK_TRANSFER">Transfer Bank</SelectItem>
                <SelectItem value="EWALLET">E-Wallet</SelectItem>
                <SelectItem value="OTHER">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nomor Referensi (opsional)</Label>
            <Input
              placeholder="TRF20260701001"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Batal
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Catat Pembayaran"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function BillsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedBill, setSelectedBill] = useState<{
    id: string;
    final_amount: number;
    tenant: { full_name: string };
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["bills", statusFilter],
    queryFn: () => billsApi.getAll({ status: statusFilter || undefined }),
  });

  const bills = data?.data || [];
  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Tagihan</h2>
            <p className="text-slate-500 mt-1">Kelola semua tagihan penghuni</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Status</SelectItem>
              <SelectItem value="UNPAID">Belum Lunas</SelectItem>
              <SelectItem value="PARTIALLY_PAID">Sebagian</SelectItem>
              <SelectItem value="PAID">Lunas</SelectItem>
              <SelectItem value="WAIVED">Dihapuskan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="h-12 bg-slate-100 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : bills.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-slate-500">Tidak ada tagihan ditemukan</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bills.map((bill) => (
              <Card key={bill.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 truncate">
                          {bill.tenant.full_name}
                        </p>
                        {statusBadge(bill.status)}
                        {bill.late_fee_info.is_overdue && (
                          <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                            Terlambat {bill.late_fee_info.days_overdue} hari
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {bill.property.name} · Kamar {bill.room.room_number} ·{" "}
                        {MONTH_NAMES[bill.period_month - 1]} {bill.period_year}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-900">
                        {formatRupiah(bill.final_amount)}
                      </p>
                      {bill.late_fee_info.late_fee_amount > 0 && (
                        <p className="text-xs text-red-500">
                          +{formatRupiah(bill.late_fee_info.late_fee_amount)}{" "}
                          denda
                        </p>
                      )}
                    </div>
                    {(bill.status === "UNPAID" ||
                      bill.status === "PARTIALLY_PAID") && (
                      <Button size="sm" onClick={() => setSelectedBill(bill)}>
                        Catat Bayar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedBill && (
        <PaymentDialog
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
          onSuccess={() =>
            queryClient.invalidateQueries({ queryKey: ["bills"] })
          }
        />
      )}
    </DashboardLayout>
  );
}
