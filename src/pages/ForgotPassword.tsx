import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/auth";
import { Building2, AlertCircle, CheckCircle2, ChevronRight, Mail } from "lucide-react";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "tenant">("owner");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email, role);
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Terjadi kesalahan saat memproses permintaan";
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
          <h2 className="text-headline-md font-bold text-on-surface">Email Terkirim</h2>
          <p className="text-on-surface-variant mt-3 leading-relaxed">
            Jika email terdaftar, instruksi reset password beserta token keamanan akan dikirimkan ke <strong className="text-on-surface">{email}</strong>.
          </p>
          <div className="mt-8 pt-6 border-t border-outline-variant/50">
            <Link to="/reset-password" className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
              Lanjutkan ke Reset Password <ChevronRight size={16} />
            </Link>
            <Link to="/login" className="btn-ghost w-full py-2.5 mt-2">
              Kembali ke Login
            </Link>
          </div>
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
            Kembalikan akses
            <br />
            ke akun Anda.
          </h1>
          <p className="text-white/70 text-body-lg">
            Masukkan alamat email yang terdaftar dan kami akan mengirimkan token untuk mereset kata sandi Anda.
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
            <h2 className="text-headline-md text-on-surface font-bold">Lupa Password</h2>
            <p className="text-on-surface-variant text-body-md mt-1">
              Ingat kata sandi Anda?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Masuk di sini
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector */}
            <div>
              <label className="label">Tipe Akun</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("owner")}
                  className={`py-2 rounded font-semibold text-body-sm transition-all border ${
                    role === "owner"
                      ? "bg-primary-container text-primary border-primary"
                      : "bg-white text-on-surface-variant border-outline-variant hover:bg-surface-container-low"
                  }`}
                >
                  Pemilik (Owner)
                </button>
                <button
                  type="button"
                  onClick={() => setRole("tenant")}
                  className={`py-2 rounded font-semibold text-body-sm transition-all border ${
                    role === "tenant"
                      ? "bg-primary-container text-primary border-primary"
                      : "bg-white text-on-surface-variant border-outline-variant hover:bg-surface-container-low"
                  }`}
                >
                  Penghuni (Tenant)
                </button>
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                Alamat Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  className="input pr-10"
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  <Mail size={16} />
                </div>
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
                  Mengirim...
                </span>
              ) : (
                "Kirim Token Reset"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
