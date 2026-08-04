import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { useToast } from "../components/Toast";
import { Building2, Eye, EyeOff, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { success: toastSuccess } = useToast();

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        token: token.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setSuccess(true);
      toastSuccess("Kata sandi berhasil disetel ulang");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Gagal menyetel ulang kata sandi. Pastikan token reset benar.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="card p-8 w-full max-w-md text-center animate-fade-in">
          <CheckCircle2 size={56} className="text-secondary mx-auto mb-4" />
          <h2 className="text-headline-md font-bold text-on-surface">Password Berhasil Diubah!</h2>
          <p className="text-on-surface-variant mt-2">Mengarahkan Anda kembali ke halaman masuk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
            <Building2 size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-body-lg">KosKu</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-[40px] font-bold leading-tight text-white tracking-tight">
            Buat sandi baru
            <br />
            yang lebih kuat.
          </h1>
          <p className="text-white/70 text-body-lg">
            Password baru minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan simbol.
          </p>
        </div>

        <p className="text-white/40 font-mono text-label-sm">
          © 2026 KosKu · v1.0.0
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="font-bold text-on-surface text-body-lg">KosKu</span>
          </div>

          <div className="mb-6">
            <h2 className="text-headline-md text-on-surface font-bold">Atur Ulang Sandi</h2>
            <p className="text-on-surface-variant text-body-md mt-1">
              Sudah ingat sandi?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Masuk di sini
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Token */}
            <div>
              <label htmlFor="token" className="label">
                Token Keamanan (Reset Token)
              </label>
              <div className="relative">
                <input
                  id="token"
                  type="text"
                  className="input pr-10 font-mono text-center tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal placeholder:font-sans"
                  placeholder="Masukkan token dari email..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  <KeyRound size={16} />
                </div>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="label">
                Password Baru
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  className="input pr-10"
                  placeholder="Min. 8 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-body-sm text-on-surface-variant mt-1">Mengandung huruf besar, kecil, angka, &amp; simbol</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="label">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className="input pr-10"
                  placeholder="Ulangi password baru..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 p-3 bg-error-container rounded-lg">
                <AlertCircle size={15} className="text-error shrink-0 mt-0.5" />
                <p className="text-body-sm text-error-on-container">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-2.5 text-body-md"
            >
              {isLoading ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Mengubah Sandi...
                </span>
              ) : (
                "Simpan Password Baru"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
