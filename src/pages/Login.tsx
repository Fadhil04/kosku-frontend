import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Building2, Eye, EyeOff, AlertCircle } from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const role = await login(email, password);
      navigate(role === "tenant" ? "/tenant/dashboard" : "/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Email atau password salah";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

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

        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-[40px] font-bold leading-tight text-white tracking-tight">
              Kelola properti
              <br />
              dengan lebih
              <br />
              profesional.
            </h1>
            <p className="text-white/70 text-body-lg leading-relaxed">
              Sistem manajemen kos terpadu — dari kontrak, tagihan, hingga
              pengaduan, semua dalam satu platform.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="space-y-3">
            {[
              "Generate tagihan otomatis untuk semua penghuni",
              "Reminder email H-7, H-3 sebelum jatuh tempo",
              "Laporan pendapatan & tingkat hunian real-time",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <p className="text-white/80 text-body-sm">{feat}</p>
              </div>
            ))}
          </div>
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
            <span className="font-bold text-on-surface text-body-lg">
              KosKu
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-headline-md text-on-surface font-bold">
              Masuk ke akun
            </h2>
            <p className="text-on-surface-variant text-body-md mt-1">
              Belum punya akun?{" "}
              <Link
                to="/register"
                className="text-primary font-medium hover:underline"
              >
                Daftar di sini
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="owner@kosku.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="label mb-0">
                  Password
                </label>
                <Link to="/forgot-password" className="text-body-sm text-primary font-medium hover:underline">
                  Lupa Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Masuk...
                </span>
              ) : (
                "Masuk"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
