import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/axios';
import { Building2, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', phone_number: '', password: '', confirm_password: '' });
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      setError('Konfirmasi password tidak cocok');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/register/owner', {
        full_name: form.full_name,
        email: form.email,
        phone_number: form.phone_number || undefined,
        password: form.password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Pendaftaran gagal');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center animate-fade-in">
          <CheckCircle2 size={56} className="text-secondary mx-auto mb-4" />
          <h2 className="text-headline-md font-bold text-on-surface">Pendaftaran Berhasil!</h2>
          <p className="text-on-surface-variant mt-2">Mengarahkan ke halaman login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
            <Building2 size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-body-lg">KosKu</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-[40px] font-bold leading-tight text-white tracking-tight">
            Mulai kelola kos<br />dengan lebih<br />mudah.
          </h1>
          <p className="text-white/70 text-body-lg">Daftarkan akun owner kamu dan mulai mengelola properti dalam hitungan menit.</p>
        </div>
        <p className="text-white/40 font-mono text-label-sm">© 2026 KosKu</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8">
            <h2 className="text-headline-md font-bold text-on-surface">Buat Akun Owner</h2>
            <p className="text-on-surface-variant text-body-md mt-1">Sudah punya akun? <Link to="/login" className="text-primary font-medium hover:underline">Masuk di sini</Link></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nama Lengkap</label>
              <input className="input" placeholder="Budi Santoso" value={form.full_name} onChange={set('full_name')} required autoFocus />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="budi@email.com" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label">Nomor HP <span className="text-on-surface-variant font-normal">opsional</span></label>
              <input className="input" placeholder="08123456789" value={form.phone_number} onChange={set('phone_number')} />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input pr-10" placeholder="Min. 8 karakter" value={form.password} onChange={set('password')} required minLength={8} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant" tabIndex={-1}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-body-sm text-on-surface-variant mt-1">Harus ada huruf besar, kecil, angka, dan simbol</p>
            </div>
            <div>
              <label className="label">Konfirmasi Password</label>
              <input type="password" className="input" placeholder="Ulangi password" value={form.confirm_password} onChange={set('confirm_password')} required />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 bg-error-container rounded-lg">
                <AlertCircle size={15} className="text-error shrink-0 mt-0.5" />
                <p className="text-body-sm text-error-on-container">{error}</p>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5">
              {isLoading ? <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Mendaftar...</span> : 'Daftar Sekarang'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
