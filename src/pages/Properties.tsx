import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { propertiesApi } from "../api/properties";
import { DashboardLayout } from "../components/DashboardLayout";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Plus, Building2, MapPin, ChevronRight } from "lucide-react";

function AddPropertyDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await propertiesApi.create(form);
      setOpen(false);
      setForm({
        name: "",
        address: "",
        city: "",
        province: "",
        postal_code: "",
      });
      onSuccess();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Gagal menambahkan properti",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus size={16} className="mr-2" />
          Tambah Properti
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Properti Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Nama Properti</Label>
            <Input
              placeholder="Kos Pak Budi"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Alamat</Label>
            <Input
              placeholder="Jl. Merpati No. 12"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Kota</Label>
              <Input
                placeholder="Tangerang"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Provinsi</Label>
              <Input
                placeholder="Banten"
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                required
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Menyimpan..." : "Simpan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PropertiesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: propertiesApi.getAll,
  });

  const properties = data?.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Properti</h2>
            <p className="text-slate-500 mt-1">
              Kelola semua properti kos kamu
            </p>
          </div>
          <AddPropertyDialog
            onSuccess={() =>
              queryClient.invalidateQueries({ queryKey: ["properties"] })
            }
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-32 bg-slate-100 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">
                Belum ada properti. Tambahkan properti pertamamu!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {properties.map((property) => (
              <Link key={property.id} to={`/properties/${property.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">
                        {property.name}
                      </CardTitle>
                      <ChevronRight size={16} className="text-slate-400 mt-1" />
                    </div>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <MapPin size={12} />
                      {property.city}, {property.province}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-slate-900">
                          {property.stats.total_rooms}
                        </p>
                        <p className="text-xs text-slate-500">Total</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-green-700">
                          {property.stats.occupied_rooms}
                        </p>
                        <p className="text-xs text-green-600">Terisi</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-blue-700">
                          {property.stats.available_rooms}
                        </p>
                        <p className="text-xs text-blue-600">Tersedia</p>
                      </div>
                    </div>
                    {property.stats.unpaid_bills_count > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">
                          {property.stats.unpaid_bills_count} tagihan belum
                          lunas
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
