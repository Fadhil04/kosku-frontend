import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/axios';
import { DashboardLayout } from '../components/DashboardLayout';
import { useToast } from '../components/Toast';
import { User, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { success, error: toastError } = useToast();

  // Profile form
  const [profile, setProfile] = useState({
    full_name: user?.full_name ?? '',
    phone_number: user?.phone_number ?? '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form
  const [pass, setPass] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await apiClient.put('/auth/me', {
        full_name: profile.full_name,
        phone_number: profile.phone_number || undefined,
      });
      await refreshProfile();
      success('Profil berhasil diperbarui');
    } catch (err: unknown) {
      toastError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal menyimpan profil');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePassChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    if (pass.new_password !== pass.confirm_password) {
      setPassError('Konfirmasi password tidak cocok');
      return;
    }
    setPassLoading(true);
    try {
      await apiClient.put('/auth/me/password', {
        current_password: pass.current_password,
        new_password: pass.new_password,
        confirm_password: pass.confirm_password,
      });
      success('Password berhasil diubah');
      setPass({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: unknown) {
      setPassError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <DashboardLayout title="Profil" subtitle="Kelola informasi akun kamu">
      <div className="max-w-lg space-y-6 animate-fade-in">
        {/* Profile card */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-primary-fixed flex items-center justify-center">
              <User size={17} className="text-primary-container" />
            </div>
            <div>
              <h2 className="font-bold text-on-surface text-body-lg">Informasi Profil</h2>
              <p className="text-body-sm text-on-surface-variant">{user?.email}</p>
            </div>
          </div>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="label">Nama Lengkap</label>
              <input className="input" value={profile.full_name}
                onChange={(e) => setProfile((f) => ({ ...f, full_name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Nomor HP <span className="text-on-surface-variant font-normal">opsional</span></label>
              <input className="input" placeholder="08123456789" value={profile.phone_number}
                onChange={(e) => setProfile((f) => ({ ...f, phone_number: e.target.value }))} />
            </div>
            <button type="submit" disabled={profileLoading} className="btn-primary">
              {profileLoading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menyimpan...</span> : <><CheckCircle2 size={15} />Simpan Profil</>}
            </button>
          </form>
        </div>

        {/* Password card */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center">
              <Lock size={17} className="text-on-surface-variant" />
            </div>
            <h2 className="font-bold text-on-surface text-body-lg">Ubah Password</h2>
          </div>
          <form onSubmit={handlePassChange} className="space-y-4">
            <div>
              <label className="label">Password Saat Ini</label>
              <input type="password" className="input" value={pass.current_password}
                onChange={(e) => setPass((f) => ({ ...f, current_password: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Password Baru</label>
              <input type="password" className="input" placeholder="Min. 8 karakter" value={pass.new_password}
                onChange={(e) => setPass((f) => ({ ...f, new_password: e.target.value }))} required minLength={8} />
            </div>
            <div>
              <label className="label">Konfirmasi Password Baru</label>
              <input type="password" className="input" value={pass.confirm_password}
                onChange={(e) => setPass((f) => ({ ...f, confirm_password: e.target.value }))} required />
            </div>
            {passError && (
              <div className="flex items-start gap-2.5 p-3 bg-error-container rounded-lg">
                <AlertCircle size={15} className="text-error shrink-0 mt-0.5" />
                <p className="text-body-sm text-error-on-container">{passError}</p>
              </div>
            )}
            <button type="submit" disabled={passLoading} className="btn-secondary">
              {passLoading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />Menyimpan...</span> : 'Ubah Password'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
