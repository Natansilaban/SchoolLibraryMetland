'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Library, ShieldCheck, GraduationCap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState(null);
  const [error, setError] = useState('');

  const executeLogin = async (email, password) => {
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email atau password tidak sesuai. Silakan periksa kembali.');
        setLoading(false);
        setActiveDemo(null);
      } else {
        const target = (email && email.toLowerCase().includes('admin')) ? '/admin/dashboard' : '/siswa/dashboard';
        window.location.replace(target);
      }
    } catch {
      setError('Terjadi kendala saat menghubungkan ke server perpustakaan.');
      setLoading(false);
      setActiveDemo(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await executeLogin(form.email, form.password);
  };

  const handleQuickDemo = async (role) => {
    if (loading) return;
    setActiveDemo(role);
    if (role === 'admin') {
      setForm({ email: 'admin@metland.sch.id', password: 'admin123' });
      await executeLogin('admin@metland.sch.id', 'admin123');
    } else {
      setForm({ email: 'siswa@metland.sch.id', password: 'siswa123' });
      await executeLogin('siswa@metland.sch.id', 'siswa123');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#FBFBF9]" role="main">
      <div className="w-full max-w-md space-y-6">
        {/* Scholastic Library Brand Identity */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-xs mx-auto p-2">
            <img src="/logo.png" alt="Logo Metland School" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Perpustakaan Metland School
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Sistem Informasi Peminjaman & Koleksi Buku
          </p>
        </div>

        {/* Quick Access Account Selector (Disable in strict production via NEXT_PUBLIC_ENABLE_DEMO_LOGIN=false) */}
        {process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN !== 'false' && (
          <section
            aria-labelledby="quick-access-title"
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 id="quick-access-title" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Akses Langsung Akun Uji Coba
              </h2>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                1-Klik Masuk
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                disabled={loading}
                aria-label="Masuk sebagai Administrator Perpustakaan"
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 transition-colors disabled:opacity-60 min-h-[42px]"
              >
                <ShieldCheck size={16} className="text-blue-600 flex-shrink-0" />
                <span>{activeDemo === 'admin' ? 'Memuat...' : 'Akun Petugas'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('siswa')}
                disabled={loading}
                aria-label="Masuk sebagai Akun Siswa"
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 transition-colors disabled:opacity-60 min-h-[42px]"
              >
                <GraduationCap size={16} className="text-blue-600 flex-shrink-0" />
                <span>{activeDemo === 'siswa' ? 'Memuat...' : 'Akun Siswa'}</span>
              </button>
            </div>
          </section>
        )}

        {/* Standard Credentials Form */}
        <div className="library-card p-6 sm:p-7 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Masuk dengan Kredensial</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gunakan email dan kata sandi akun perpustakaan Anda
            </p>
          </div>

          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="flex items-center gap-2.5 p-3 rounded-lg text-xs font-medium bg-rose-50 border border-rose-200 text-rose-800"
            >
              <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="form-label text-xs">
                Alamat Email Terdaftar
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  className="library-input pl-10 text-xs sm:text-sm"
                  placeholder="nama@metland.sch.id"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="form-label text-xs">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="library-input pl-10 pr-10 text-xs sm:text-sm"
                  placeholder="Masukkan kata sandi"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  aria-label={showPass ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-xs sm:text-sm font-semibold min-h-[44px]"
            >
              {loading ? 'Memverifikasi...' : 'Masuk ke Sistem Perpustakaan'}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Siswa baru belum memiliki akun?{' '}
              <Link
                href="/register"
                className="font-bold text-blue-700 hover:text-blue-900 hover:underline transition-colors"
              >
                Daftar Akun Baru
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
