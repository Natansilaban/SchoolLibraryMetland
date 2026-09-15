'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email atau password salah. Silakan coba lagi.');
        setLoading(false);
      } else {
        const session = await getSession();
        const target = session?.user?.role === 'ADMIN' ? '/admin/dashboard' : '/siswa/dashboard';
        window.location.replace(target);
      }
    } catch {
      setError('Terjadi kendala saat menghubungkan ke server.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden" role="main">
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

        <div className="glass-card p-6 sm:p-8 shadow-lg">
          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-900">Masuk ke akun Anda</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Gunakan email dan password terdaftar Anda
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
                  placeholder="email@metland.sch.id"
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
        </div>

        <p className="text-center text-xs mt-5 text-slate-400 font-medium">
          © 2026 Metland School Library System
        </p>
      </div>
    </main>
  );
}
