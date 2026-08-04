import { useEffect, useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAuth } from "../hooks/useAuth";
import { apiClient } from "../lib/axios";
import { useToast } from "../components/Toast";
import {
  User,
  Lock,
  AlertCircle,
  CheckCircle2,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";

export function TenantProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { success, error: toastError } = useToast();

  const [profile, setProfile] = useState({
    full_name: user?.full_name ?? "",
    phone_number: user?.phone_number ?? "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [pass, setPass] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState("");

  useEffect(() => {
    setProfile({
      full_name: user?.full_name ?? "",
      phone_number: user?.phone_number ?? "",
    });
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await apiClient.put("/auth/me", {
        full_name: profile.full_name,
        phone_number: profile.phone_number || undefined,
      });
      await refreshProfile();
      success("Profil berhasil diperbarui");
    } catch (err: unknown) {
      toastError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Gagal menyimpan profil",
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePassChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    if (pass.new_password !== pass.confirm_password) {
      setPassError("Konfirmasi password tidak cocok");
      return;
    }
    setPassLoading(true);
    try {
      await apiClient.put("/auth/me/password", {
        current_password: pass.current_password,
        new_password: pass.new_password,
        confirm_password: pass.confirm_password,
      });
      success("Password berhasil diubah");
      setPass({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err: unknown) {
      setPassError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Gagal mengubah password",
      );
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Profil Penghuni"
      subtitle="Kelola akun Anda sebagai penghuni"
    >
      <div className="max-w-2xl space-y-6 animate-fade-in">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center">
              <User size={18} className="text-primary-container" />
            </div>
            <div>
              <p className="font-semibold text-on-surface">Informasi akun</p>
              <p className="text-body-sm text-on-surface-variant">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mb-5">
            <div className="rounded-lg border border-outline-variant/70 p-4">
              <div className="flex items-center gap-2 text-primary">
                <PhoneCall size={15} />
                <p className="font-semibold text-on-surface">Kontak</p>
              </div>
              <p className="text-body-sm text-on-surface-variant mt-2">
                {user?.phone_number || "Belum ada nomor telepon"}
              </p>
            </div>
            <div className="rounded-lg border border-outline-variant/70 p-4">
              <div className="flex items-center gap-2 text-secondary">
                <ShieldCheck size={15} />
                <p className="font-semibold text-on-surface">Keamanan</p>
              </div>
              <p className="text-body-sm text-on-surface-variant mt-2">
                Gunakan password yang kuat dan jangan bagikan akun Anda.
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="label">Nama Lengkap</label>
              <input
                className="input"
                value={profile.full_name}
                onChange={(e) =>
                  setProfile((value) => ({
                    ...value,
                    full_name: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <label className="label">Nomor HP</label>
              <input
                className="input"
                value={profile.phone_number}
                onChange={(e) =>
                  setProfile((value) => ({
                    ...value,
                    phone_number: e.target.value,
                  }))
                }
                placeholder="08123456789"
              />
            </div>
            <button
              type="submit"
              disabled={profileLoading}
              className="btn-primary"
            >
              {profileLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                  Menyimpan...
                </span>
              ) : (
                <>
                  <CheckCircle2 size={15} /> Simpan profil
                </>
              )}
            </button>
          </form>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
              <Lock size={18} className="text-on-surface-variant" />
            </div>
            <div>
              <p className="font-semibold text-on-surface">Ubah password</p>
              <p className="text-body-sm text-on-surface-variant">
                Jaga akun tetap aman.
              </p>
            </div>
          </div>

          <form onSubmit={handlePassChange} className="space-y-4">
            <div>
              <label className="label">Password Saat Ini</label>
              <input
                type="password"
                className="input"
                value={pass.current_password}
                onChange={(e) =>
                  setPass((value) => ({
                    ...value,
                    current_password: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <label className="label">Password Baru</label>
              <input
                type="password"
                className="input"
                value={pass.new_password}
                onChange={(e) =>
                  setPass((value) => ({
                    ...value,
                    new_password: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <label className="label">Konfirmasi Password Baru</label>
              <input
                type="password"
                className="input"
                value={pass.confirm_password}
                onChange={(e) =>
                  setPass((value) => ({
                    ...value,
                    confirm_password: e.target.value,
                  }))
                }
                required
              />
            </div>
            {passError && (
              <div className="flex items-start gap-2.5 rounded-lg bg-error-container p-3 text-error-on-container">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span className="text-body-sm">{passError}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={passLoading}
              className="btn-secondary"
            >
              {passLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />{" "}
                  Menyimpan...
                </span>
              ) : (
                "Ubah password"
              )}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
