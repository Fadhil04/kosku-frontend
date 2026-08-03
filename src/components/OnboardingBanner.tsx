import { useNavigate } from 'react-router-dom';
import { Building2, BedDouble, Users, FileText, ArrowRight } from 'lucide-react';

export function OnboardingBanner() {
  const navigate = useNavigate();

  const steps = [
    { icon: Building2, label: 'Tambah Properti', path: '/properties', desc: 'Daftarkan gedung kos kamu' },
    { icon: BedDouble, label: 'Tambah Kamar',    path: '/properties', desc: 'Isi kamar-kamar yang ada' },
    { icon: Users,    label: 'Tambah Penghuni',  path: '/tenants',    desc: 'Daftarkan data penghuni' },
    { icon: FileText, label: 'Buat Kontrak',     path: '/contracts',  desc: 'Generate tagihan otomatis' },
  ];

  return (
    <div className="card p-6 border-primary/20 bg-primary-fixed/20 animate-fade-in">
      <div className="mb-5">
        <h2 className="font-bold text-on-surface text-body-lg">Selamat datang di KosKu! 👋</h2>
        <p className="text-body-sm text-on-surface-variant mt-1">
          Ikuti langkah berikut untuk mulai mengelola kos kamu.
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map(({ icon: Icon, label, path, desc }, i) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="bg-white rounded-lg border border-outline-variant p-4 text-left hover:shadow-card-hover hover:border-primary/40 transition-all group"
          >
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                <span className="font-mono text-label-sm font-bold">{i + 1}</span>
              </div>
              <Icon size={15} className="text-primary-container" />
            </div>
            <p className="font-semibold text-on-surface text-body-sm">{label}</p>
            <p className="text-body-sm text-on-surface-variant mt-0.5">{desc}</p>
            <div className="flex items-center gap-1 mt-2 text-primary text-body-sm opacity-0 group-hover:opacity-100 transition-opacity">
              Mulai <ArrowRight size={12} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
