'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Sparkles, ShieldCheck, GraduationCap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState(null); // 'admin' | 'siswa' | null
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
        setError('Email atau password salah. Silakan coba lagi.');
        setLoading(false);
        setActiveDemo(null);
      } else {
        const target = (email && email.toLowerCase().includes('admin')) ? '/admin/dashboard' : '/siswa/dashboard';
        window.location.replace(target);
      }
    } catch {
      setError('Terjadi kendala saat menghubungkan ke server.');
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
    <main className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden" role="main">
      {/* Ambient background orbs for Light Mode */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-40 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
            top: '-10%',
            left: '10%',
          }}
        />
        <div
          className="absolute w-[450px] h-[450px] rounded-full opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
            bottom: '10%',
            right: '10%',
          }}
        />
      </div>

      <div className="w-full max-w-md relative">
        {/* Live Demo Header Badge */}
        <div className="flex justify-center mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm animate-pulse">
            <Sparkles size={13} className="text-blue-600" />
            <span>Portfolio Live Demo</span>
          </div>
        </div>

        {/* Logo & Branding */}
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-3 p-2.5 shadow-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(241,245,249,0.9) 100%)',
              border: '1px solid rgba(226,232,240,0.9)',
              boxShadow: '0 10px 25px -5px rgba(37,99,235,0.1)',
            }}
          >
            <img src="/logo.png" alt="Logo Perpustakaan Metland School" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
            Metland Library
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Sistem Perpustakaan Digital Sekolah
          </p>
        </div>

        {/* One-Click Accessible Demo Box */}
        <section
          aria-labelledby="demo-access-title"
          className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/70 to-slate-50 border border-blue-200/80 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles size={15} className="text-blue-600" />
            <h2 id="demo-access-title" className="text-xs font-extrabold uppercase tracking-wider text-blue-900">
              Akses Cepat Demo Portfolio
            </h2>
          </div>
          <p className="text-xs text-slate-600 mb-3 font-medium leading-relaxed">
            Pilih peran demo di bawah ini untuk langsung masuk otomatis tanpa perlu mengetik:
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              disabled={loading}
              aria-label="Masuk otomatis sebagai Administrator Demo"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-400 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none disabled:opacity-60"
            >
              <ShieldCheck size={15} className="text-blue-600" />
              <span>{activeDemo === 'admin' ? 'Memuat...' : 'Demo Admin'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('siswa')}
              disabled={loading}
              aria-label="Masuk otomatis sebagai Siswa Demo"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-400 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none disabled:opacity-60"
            >
              <GraduationCap size={15} className="text-indigo-600" />
              <span>{activeDemo === 'siswa' ? 'Memuat...' : 'Demo Siswa'}</span>
            </button>
          </div>
        </section>

        {/* Login Card */}
        <div className="glass-card p-6 sm:p-8 shadow-lg">
          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-900">Atau Masuk Manual</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Gunakan akun perpustakaan terdaftar Anda
            </p>
          </div>

          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="flex items-center gap-2.5 p-3 rounded-xl mb-4 text-xs font-medium"
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
              }}
            >
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="form-label text-xs font-bold text-slate-700">
                Alamat Email
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none" aria-hidden="true">
                  <Mail size={16} className="text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-required="true"
                  className="glass-input pl-10 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                  placeholder="admin@metland.sch.id"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="form-label text-xs font-bold text-slate-700">
                Password
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none" aria-hidden="true">
                  <Lock size={16} className="text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  aria-required="true"
                  className="glass-input pl-10 pr-10 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none rounded-md"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              aria-label="Masuk ke aplikasi perpustakaan"
              className="btn-primary w-full justify-center py-2.5 mt-2 text-sm font-bold focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Memproses...</span>
                </>
              ) : 'Masuk'}
            </button>
          </form>

          <hr className="glass-divider mt-5" />

          <p className="text-center text-xs mt-4 text-slate-500 font-medium">
            Belum punya akun?{' '}
            <a href="/register" className="text-blue-600 font-bold hover:text-blue-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm">
              Daftar sebagai siswa
            </a>
          </p>
        </div>

        <p className="text-center text-xs mt-5 text-slate-400 font-medium">
          © 2026 Metland School Library System · Portfolio Live Demo
        </p>
      </div>
    </main>
  );
}
